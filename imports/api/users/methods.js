import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { Accounts } from 'meteor/accounts-base';
import { Subjects } from '/imports/api/subjects/subjects.js';
import { ROLES } from '/imports/constants';

Meteor.methods({
    'users.updateRole'(options) {
        check(options.userId, String);
        check(options.role, String);

        const user = Meteor.users.findOne(this.userId);
        if (!user) {
            throw new Meteor.Error(401, 'You are not logged in.');
        }

        if (user.profile.role === ROLES.ADMIN) {
            const currentRole = Meteor.users
                .find({ _id: options.userId })
                .fetch()[0].profile.role;
            if (currentRole === ROLES.ADMIN && options.role !== ROLES.ADMIN) {
                const nrOfAdminsLeft = Meteor.users
                    .find({ 'profile.role': ROLES.ADMIN })
                    .fetch();
                if (nrOfAdminsLeft.length === 1) {
                    throw new Meteor.Error(
                        403,
                        'This user is the last administrator.'
                    );
                }
            }
            const updateDoc = {
                $set: { 'profile.role': options.role }
            };
            return Meteor.users.update({ _id: options.userId }, updateDoc);
        }
        throw new Meteor.Error(403, 'You are not allowed to access this.');
    },

    'users.remove'(options) {
        check(options.userId, String);

        const user = Meteor.users.findOne(this.userId);
        if (!user) {
            throw new Meteor.Error(401, 'You are not logged in.');
        }

        if (user.profile.role === ROLES.ADMIN) {
            const currentRole = Meteor.users
                .find({ _id: options.userId })
                .fetch()[0].profile.role;
            if (currentRole === ROLES.ADMIN) {
                const nrOfAdminsLeft = Meteor.users
                    .find({ 'profile.role': ROLES.ADMIN })
                    .fetch();
                if (nrOfAdminsLeft.length === 1) {
                    throw new Meteor.Error(
                        403,
                        'This user is the last administrator.'
                    );
                }
            }
            return Meteor.users.remove({ _id: options.userId });
        }
        throw new Meteor.Error(403, 'You are not allowed to access this.');
    },

    'users.toggleAllowVideohelp'({ userId }) {
        check(userId, String);

        const user = Meteor.users.findOne(Meteor.userId());
        if (!user) {
            throw new Meteor.Error(401, 'You are not logged in.');
        }

        if (user.profile.role !== ROLES.ADMIN) {
            throw new Meteor.Error(403, 'You are not allowed to access this.');
        }

        const otherUser = Meteor.users.findOne(userId);
        if (!otherUser) {
            throw new Meteor.Error(
                404,
                `User with id ${userId} does not exist.`
            );
        }

        Meteor.users.update(
            { _id: userId },
            {
                $set: {
                    'profile.allowVideohelp': !otherUser.profile.allowVideohelp
                }
            }
        );
    },

    'users.setProfilePictureUrl'(url) {
        check(url, String);
        if (!this.userId) {
            throw new Meteor.Error(401, 'You are not logged in.');
        }

        Meteor.users.update(
            { _id: this.userId },
            {
                $set: {
                    'profile.pictureUrl': url
                }
            }
        );
    },

    'users.create'(options) {
        const user = Meteor.users.findOne(this.userId);
        if (!user) {
            throw new Meteor.Error(401, 'You are not logged in.');
        }

        check(options.username, String);
        check(options.email, String);
        check(options.profile.firstName, String);
        check(options.profile.role, String);
        check(options.profile.allowVideohelp, Boolean);

        options.profile.forceLogOut = false;
        options.profile.subjects = [];

        if (user.profile.role === ROLES.ADMIN) {
            const userId = Accounts.createUser(options);
            Accounts.sendEnrollmentEmail(userId);
            return userId;
        }
        throw new Meteor.Error(403, 'You are not allowed to access this.');
    },

    'users.logOut'(options) {
        const user = Meteor.users.findOne(this.userId);
        if (!user) {
            throw new Meteor.Error(401, 'You are not logged in.');
        }

        check(options.userId, String);

        if (user.profile.role === ROLES.ADMIN) {
            const remoteUser = Meteor.users.find(options.userId).fetch()[0];

            if (remoteUser.status.online) {
                Meteor.users.update(
                    { _id: options.userId },
                    {
                        $set: {
                            'profile.forceLogOut': true
                        }
                    }
                );
            } else {
                Meteor.users.update(
                    { _id: options.userId },
                    {
                        $set: {
                            'services.resume.loginTokens': []
                        }
                    }
                );
            }
        } else {
            throw new Meteor.Error(403, 'You are not allowed to access this.');
        }
    }
});
