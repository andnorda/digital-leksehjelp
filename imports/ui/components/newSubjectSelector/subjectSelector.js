import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Subjects } from '/imports/api/subjects/subjects.js';
import { Config } from '/imports/api/config/config.js';

import './subjectSelector.html';

const isAvailable = name => {
    const serviceStatus = Config.findOne({ name: 'serviceStatus' });
    if (serviceStatus && !serviceStatus.open) return true;
    return (
        Meteor.users
            .find({
                subjects: name,
                'status.online': true
            })
            .count() > 0
    );
};

Template.newSubjectSelector.onCreated(function() {
    this.autorun(() => {
        this.subscribe('subjects');
        this.subscribe('config.serviceStatus');
        this.subscribe('users.loggedIn');
    });
});

Template.newSubjectSelector.helpers({
    subjects() {
        return Subjects.find().map(({ name }) => name);
    },
    onChange() {
        return this.onChange;
    },
    sort() {
        return (a, b) => {
            const aAvailable = isAvailable(a);
            const bAvailable = isAvailable(b);
            if (bAvailable && !aAvailable) {
                return 1;
            } else if (!bAvailable && aAvailable) {
                return -1;
            } else {
                const subjectA = Subjects.findOne({ name: a });
                const subjectB = Subjects.findOne({ name: b });
                return (
                    (subjectB ? subjectB.videoChatCount || 0 : 0) -
                    (subjectA ? subjectA.videoChatCount || 0 : 0)
                );
            }
        };
    },
    isAvailable() {
        return isAvailable;
    }
});
