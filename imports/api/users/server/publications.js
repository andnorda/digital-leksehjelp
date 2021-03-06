import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { ADMIN } from '/imports/userRoles.js';

Meteor.publish('users', function() {
    if (!this.userId) {
        return this.ready();
    }

    const user = Meteor.users.findOne(this.userId);
    if (user.profile.role === ADMIN) {
        return Meteor.users.find(
            {},
            { fields: { username: 1, emails: 1, profile: 1, subjects: 1 } }
        );
    }

    return Meteor.users.find(
        {},
        {
            fields: {
                username: true,
                subjects: 1,
                'status.online': 1,
                profile: 1
            }
        }
    );
});

Meteor.publish('users.self', function() {
    if (!this.userId) {
        return this.ready();
    }

    return Meteor.users.find(this.userId);
});

Meteor.publish('users.byId', function (userId) {
    check(userId, String);

    return Meteor.users.find(userId, {
        fields: {
            'profile.firstName': 1
        }
    });
});
