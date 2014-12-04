Template.registerHelper('isGreaterThanZero', function(value) {
  if(value > 0) {
    return true;
  }
  return false
});

Template.registerHelper('not', function(value) {
    return !value;
});

Template.registerHelper('eq', function(value1, value2) {
    return value1 === value2;
});

Template.registerHelper('globalRoles', function(block) {
    return ROLES;
});

Template.registerHelper('optionsSelected', function(values, defaultValue) {
    var buffer = "";
    if (Array.isArray(values)) {
        // TODO(martin): If needed, treat as array.
    } else {
        // Treat as object
        for (var value in values) {
            var option = '';
            if (values[value] === defaultValue) {
                buffer += '<option selected>' + values[value] + '</option>';
            } else {
                buffer += '<option>' + values[value] + '</option>';
            };
        }
    }
    return new Spacebars.SafeString(buffer);
});

Template.registerHelper('transformNewline', function(text) {
    return new Spacebars.SafeString(text.replace(/(\r\n|\n|\r)/g, "<br>"));
});

Template.registerHelper('serviceIsOpen', function () {
    var serviceStatusArray = Config.find({ name: "serviceStatus" }).fetch();
        if (serviceStatusArray.length > 0) {
            return serviceStatusArray[0].open;
        }
        return false;
    }
);

Template.registerHelper('trim', function(str, stopIndex) {
    if (str.length < stopIndex) {
        return str;
    }
    return str.substring(0, stopIndex) + "...";
});

Template.registerHelper('grades', function(subjectId) {
    return GRADES;
});

Template.registerHelper('subjects', function(subjectId) {
    return Subjects.find({});
});

Template.registerHelper('subjectName', function(subjectId) {
    var subject = Subjects.findOne({ _id: subjectId });
    return (subject) ? subject.name : "Ukjent fag";
});

Template.registerHelper('username', function(userId) {
    if (Meteor.userId()) {
        Meteor.users.findOne(userId)
        var user = Meteor.users.findOne(userId);
        return (user) ? user.username : "";
    }
});

Template.registerHelper('fromNow', function(date) {
    if (date) {
        return moment(date).fromNow();
    }
});

Template.registerHelper('prettifyDate', function(date) {
    if (date) {
        return moment(date).format("D.M.YYYY HH:mm");
    }
});

Template.registerHelper('isNotMe', function(userId) {
    return Meteor.userId() && Meteor.userId() != userId;
});