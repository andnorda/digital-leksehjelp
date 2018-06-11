import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';
import { ReactiveDict } from 'meteor/reactive-dict';
import { Router } from 'meteor/iron:router';
import { StudentSessions } from '/imports/api/studentSessions/studentSessions.js';
import { timeSince } from '/imports/utils.js';
import mixpanel from '/imports/mixpanel.js';
import { getQueueTime } from '/imports/utils.js';
import { STUDENT_SESSION_STATE } from '/imports/constants';
import '../../components/openService/openService.js';
import '../../components/tagList/tagList.js';

import './queueAdmin.html';
import './queueAdmin.less';

Template.queueAdmin.onCreated(function() {
    this.autorun(() => {
        this.subscribe('studentSessions');
        this.subscribe('users.self');
    });
});

Template.queueAdmin.helpers({
    mySubjectsQueue() {
        const { subjects = [], helpTopics = [] } = Meteor.user();
        return (
            subjects.length &&
            StudentSessions.find({
                $or: subjects
                    .map(subject => ({ subject }))
                    .concat(
                        helpTopics.map(helpTopic => ({ subject: helpTopic }))
                    ),
                state: STUDENT_SESSION_STATE.WAITING
            })
        );
    },
    otherSubjectsQueue() {
        const { subjects = [], helpTopics = [] } = Meteor.user();
        return StudentSessions.find(
            subjects.length
                ? {
                      $and: subjects
                          .map(subject => ({
                              subject: { $ne: subject }
                          }))
                          .concat(
                              helpTopics.map(helpTopic => ({
                                  subject: { $ne: helpTopic }
                              }))
                          ),
                      state: STUDENT_SESSION_STATE.WAITING
                  }
                : { state: STUDENT_SESSION_STATE.WAITING }
        );
    },
    activeSessions() {
        const { profile: { subjects = [] } } = Meteor.user();
        return StudentSessions.find({
            $or: [
                { state: STUDENT_SESSION_STATE.READY },
                { state: STUDENT_SESSION_STATE.GETTING_HELP }
            ]
        });
    },
    hasStudentsInQueue() {
        return (
            StudentSessions.find({
                state: STUDENT_SESSION_STATE.WAITING
            }).count() > 0
        );
    },
    hasActiveStudents() {
        return (
            StudentSessions.find({
                $or: [
                    { state: STUDENT_SESSION_STATE.READY },
                    { state: STUDENT_SESSION_STATE.GETTING_HELP }
                ]
            }).count() > 0
        );
    }
});

Template.studentSession.onCreated(function() {
    this.state = new ReactiveDict();
    interval = Meteor.setInterval(() => {
        this.state.set('time', new Date());
    }, 1000);
});

Template.studentSession.helpers({
    timeInQueue() {
        return timeSince(
            this.createdAt,
            Template.instance().state.get('time') || new Date()
        );
    },
    isVideo() {
        return this.type === 'video';
    },
    text() {
        return this.temp
            ? this.temp.text && this.temp.text.length > 256
              ? `${this.temp.text.substring(0, 256)}...`
              : this.temp.text
            : '';
    }
});

Template.studentSession.events({
    'click button.startTutoring'() {
        Session.set('startTutoringTime', new Date().getTime());
        const sessionId = this._id;
        Meteor.call('studentSessions.startTutoring', sessionId);

        if (this.type === 'video') {
            window.open(this.videoConferenceUrl);
            Session.set('studentSessionId', sessionId);
            $('#endSessionModal').modal();
        } else {
            Router.go(`/frivillig/chat/${this._id}`);
        }
    },

    'click button.deleteSession'() {
        Meteor.call('studentSessions.delete', this._id);
    }
});

Template.activeStudentSession.onCreated(function() {
    this.autorun(() => {
        this.subscribe('users');
    });
});

Template.activeStudentSession.helpers({
    isVideo() {
        return this.type === 'video';
    },
    volunteers() {
        return this.volunteers
            .map(({ id }) => Meteor.users.findOne(id))
            .filter(user => user)
            .map(user => user.profile.firstName)
            .join(', ');
    }
});

Template.activeStudentSession.events({
    'click button.startTutoring'() {
        Meteor.call('studentSessions.addVolunteer', this._id, Meteor.userId());
        if (this.type === 'video') {
            window.open(this.videoConferenceUrl);
        } else {
            Router.go(`/frivillig/chat/${this._id}`);
        }
    },

    'click button.deleteSession'() {
        const helpDurationMinutes = getQueueTime(
            Session.get('startTutoringTime')
        );
        if (helpDurationMinutes > 4) {
            mixpanel.track('Hjulpet elev', {
                'Minutter i samtale': helpDurationMinutes,
                type: this.type
            });
        }

        Meteor.call('studentSessions.endTutoring', this._id);
    }
});