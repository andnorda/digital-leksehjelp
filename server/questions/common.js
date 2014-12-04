this.QuestionHelpers = {
    parseSearchParams: function (params) {
        var selector = { $and: [] };
        var options = { fields: { score: { $meta: "textScore" }}};

        if (params.hasOwnProperty('q') && params['q'] !== '') {
            selector.$and.push({ "$text": { "$search": params.q } });
        }
        if (params.hasOwnProperty('subject') && params['subject'] !== '_all') {
            var subject = Subjects.findOne({ humanReadableId: params.subject });
            if (subject) {
                selector.$and.push({ subjectId: subject._id });
            }
        }
        if (params.hasOwnProperty('grade') && params['grade'] !== '_all') {
            selector.$and.push({ grade: params.grade });
        }

        // default sorting
        options['sort'] = { score: { $meta: "textScore" }};

        if (params.hasOwnProperty('sort')) {
            if (params['sort'] === 'date') {
                options['sort'] = { questionDate: -1 };
            }
        }

        return {selector: selector, options: options};
    },
    searchCriteraBuilder: function (params) {
        var searchCritera = QuestionHelpers.parseSearchParams(params);

        searchCritera.selector.$and.push({ answer: { $exists: true }});

        if (!this.userId) {
            searchCritera.selector.$and.push(
                { verifiedBy: { $exists: true }},
                { publishedBy: { $exists: true }}
            )
        }

        return searchCritera;
    },
    search: function (params) {
        var searchCritera = QuestionHelpers.searchCriteraBuilder(params);

        return Questions.find(searchCritera.selector, searchCritera.options);
    }
}