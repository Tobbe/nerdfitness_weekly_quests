// ==UserScript==
// @name         NF Weekly Quests
// @namespace    https://github.com/tobbe
// @version      0.1
// @description  Adds a weekly quests page
// @license      MIT
// @author       Tobbe
// @match        https://www.nerdfitness.com/*
// @resource     icon https://i.imgur.com/Q8fA1gf.png
// @run-at       document-start
// @grant        GM_getResourceURL
// @grant        GM_addStyle
// ==/UserScript==

(function() {
    'use strict';

    GM_addStyle(`
        #navlist .nav-weekly-quests a {
            color: #424242;
            text-align: center;
            text-transform: uppercase;
            padding-top: 124px;
        }

         #navlist .nav-weekly-quests:hover a {
            color: #eee;
        }
    `);

    function htmlToElement(html) {
        const template = document.createElement('template');
        template.innerHTML = html.trim();
        return template.content.firstChild;
    }

    function iconUrl(classes) {
        if (classes.includes('rebel')) {
            return 'https://www.nerdfitness.com/wp-content/uploads/2016/08/rebel-1.png';
        }

        return 'https://www.nerdfitness.com/wp-content/uploads/2016/08/academy-icon.png';
    }

    function questBox(title, id, xp, description, classes, completed) {
        const statusImage = completed ?
            'https://www.nerdfitness.com/wp-content/themes/NerdFitness/templates/images/graphics-00092.png' :
            'https://www.nerdfitness.com/wp-content/themes/NerdFitness/templates/images/graphics-00090.png';
        const completeButtonText = completed ? 'MARK NOT COMPLETE' : 'MARK COMPLETED!';
        const completeButtonImage = completed ?
            'https://www.nerdfitness.com/wp-content/themes/NerdFitness/templates/images/graphics-00031.png' :
            'https://www.nerdfitness.com/wp-content/themes/NerdFitness/templates/images/graphics-00014.png';

        return`
            <div id="" class="quests-quests-block ${classes} all" style="display: block;">
                <div class="quest-block">
                    <div class="quest-head q-complete" style="position:relative; z-index: 100;">
                        <div class="nfq-disabled-blocker" style="display: none;">
                            <img style="width:39px; height:52px;" src="/wp-content/themes/NerdFitness/images/callout-lock.png">
                        </div>
                        <p>${title}</p>
                        <img src="${iconUrl(classes)}">
                        <div class="qh-right">
                            <div class="qh-star active" data-id="${id}"></div>
                            <div class="qh-rect">${xp} xp<img style="float: right;" src="${statusImage}"></div>
                        </div>
                    </div>
                    <div class="quest-body-block">
                        <div class="col-sm-6"><img src="https://www.nerdfitness.com/wp-content/uploads/2016/07/nfq-academy.jpg"></div>
                        <div class="col-sm-6">
                            <div style="padding: 0 10px;">
                                <p></p>
                                ${description}
                                <p></p>
                                <div data-id="${id}" class="qh-complete" style="background-image: url(${completeButtonImage});">${completeButtonText}</div>
                            </div>
                        </div>
                        <div class="qh-scroll-up"><img src="https://www.nerdfitness.com/wp-content/themes/NerdFitness/templates/images/graphics-00043.png"></div>
                    </div>
                </div>
            </div>`;
    }

    function loggedInPage() {
        return window.location.href.startsWith('https://www.nerdfitness.com/level-up') ||
            window.location.href.startsWith('https://www.nerdfitness.com/my-account');
    }

    function weeklyQuestsPage() {
        return window.location.href === 'https://www.nerdfitness.com/level-up/my-quests/?weekly';
    }

    function addMenuItem() {
        const navMyChar = document.querySelector('#navlist .nav-my-char');
        const clonedNav = navMyChar.cloneNode(true);

        const insertedNode = navMyChar.parentNode.insertBefore(clonedNav, navMyChar);

        insertedNode.classList.add('nav-weekly-quests');
        insertedNode.classList.remove('current-menu-item');

        insertedNode.firstChild.innerHTML = 'Weekly Quests';
        insertedNode.firstChild.href = 'https://www.nerdfitness.com/level-up/my-quests/?weekly';

        insertedNode.style.backgroundImage = "url(" + GM_getResourceURL('icon') + ")";
    }

    if (weeklyQuestsPage()) {
        console.log('Replace page');
        document.title = 'Weekly Quests';
    }

    console.log('NF Weekly Quests');
    console.log('location.href', window.location.href);
    console.log('document.referrer', document.referrer);

    function generateQuestBoxesHtml(questStatuses) {
        let questBoxesHtml = '';

        WEEKLY_QUESTS.forEach(week => {
            questBoxesHtml += '\n<h2>' + week.title + '</h2>\n';

            week.quests.forEach(questKey => {
                const completed = questStatuses[QUESTS[questKey].id];
                questBoxesHtml += '<div>' + questBox(QUESTS[questKey].title, QUESTS[questKey].id, QUESTS[questKey].xp, QUESTS[questKey].description, QUESTS[questKey].classes, completed) + '</div>\n';
            });
        });

        return questBoxesHtml;
    }

    document.addEventListener('DOMContentLoaded', function(event) {
        console.log('DOM fully loaded and parsed');

        if (loggedInPage()) {
            console.log('logged in page');
            addMenuItem();
        }

        if (weeklyQuestsPage()) {
            statusPromise.then(questStatuses => {
                document.querySelector('#navlist .nav-my-quests').classList.remove('current-menu-item');
                document.querySelector('#navlist .nav-weekly-quests').classList.add('current-menu-item');
                document.querySelector('.fx-content-title').innerHTML = 'Weekly Quests';
                document.querySelector('.fx-inner-cont').innerHTML = generateQuestBoxesHtml(questStatuses);

                document.querySelector('.progress-big').remove();
                document.querySelector('.qh-showhide').remove();
            });
        }
    });

    var url = 'https://www.nerdfitness.com/wp-admin/admin-ajax.php?action=alm_query_posts&query_type=standard&nonce=6bc113fe44&repeater=default&theme_repeater=null&cta=&comments=&post_type%5B%5D=nfq_quest&post_format=&category=&category__not_in=&tag=&tag__not_in=&taxonomy=nfq_quest_category&taxonomy_terms=academy&taxonomy_operator=&taxonomy_relation=&meta_key=&meta_value=&meta_compare=&meta_relation=&meta_type=&author=&year=&month=&day=&post_status=&order=DESC&orderby=date&post__in=&post__not_in=&exclude=&search=&custom_args=&posts_per_page=1500&page=0&offset=0&preloaded=false&seo_start_page=1&paging=false&previous_post=false&previous_post_id=&previous_post_taxonomy=&lang=&slug=my-quests&canonical_url=https%3A%2F%2Fwww.nerdfitness.com%2Flevel-up%2Fmy-quests%2F';

    const statusPromise = new Promise((resolve, reject) => {
        fetch(url)
            .then(data => data.json())
            .then(res => {
                console.log('got all academy quests');

                const quests = res.html.split('<?php');
                const questStatuses = quests
                    .reduce((reduced, quest) => {
                        const idIndex = quest.indexOf('data-id="') + 'data-id="'.length;
                        const idEndIndex = quest.indexOf('"', idIndex + 1);
                        const id = quest.slice(idIndex, idEndIndex);
                        let complete = false;

                        if (quest.indexOf('q-complete') > 0) {
                            complete = true;
                        }

                        if (id !== '') {
                            reduced[id] = complete;
                        }

                        return reduced;
                    }, {});

                console.log('questStatuses', questStatuses);
                resolve(questStatuses);
            })
            .catch(err => {
                console.error('error');
                console.error('err', err);
                reject(err);
            });
    });

    const WEEKLY_QUESTS = [
        {
            title: 'Week One',
            quests: [
                'BEFORE_PHOTOS',
                'MEASUREMENTS',
                'FIND_BIG_WHY',
                'SHARE_BIG_WHY',
                'WALK_TO_MORDOR',
                'FOOD_LOG',
            ],
        },
        {
            title: 'Week Two',
            quests: [
                'ART_OF_GOALS',
                'START_EPIC_QUEST',
                'SHARE_EPIC_QUEST',
                'GIMME_LOOT',
                'BENCHMARK_TEST',
                'READ_FITNESS',
                'DETERMINE_DIET_LEVEL',
            ],
        },
    ];

    const QUESTS = {
        BEFORE_PHOTOS: {
            title: 'Mindset: Snap Those Before Photos!',
            id: 1026869,
            xp: 25,
            description: '<p>To complete this quest you need to snap four separate before pictures. Front, Right Side, Left Side, and Back. Save the pictures in a safe place on your computer or phone for later. You can wear anything you want. If in doubt, wear a bathing suit or similar</p>',
            classes: 'academy mindset',
        },
        MEASUREMENTS: {
            title: 'Mindset: Take Your Measurements',
            id: 1026908,
            xp: 40,
            description: '<p>To complete this quest, measure and record your starting measurements – weight, and inches or cm around your neck, chest, biceps, waist, hips, thigh, and calf.</p>',
            classes: 'academy mindset',
        },
        FIND_BIG_WHY: {
            title: 'Mindset: Find Your Big Why',
            id: 1026917,
            xp: 100,
            description: '<p>To complete this quest, you’ll simply need to write out (on paper) your own personalized “Big Why.” Challenge yourself to dig deep and be honest about what is going to motivate you when times get tough. Optionally, you can hang or frame this paper in an area where you will see it every day!</p>',
            classes: 'academy mindset',
        },
        SHARE_BIG_WHY: {
            title: 'Mindset: Share Your Big Why',
            id: 1026920,
            xp: 40,
            description: '<p>Let someone else know why you want to change your life! To complete this quest, share your personal “Big Why” with someone important to you, your accountability group, or the Academy Facebook Group.</p>',
            classes: 'academy mindset',
        },
        WALK_TO_MORDOR: {
            title: 'Fitness: Walk to Mordor',
            id: 1027262,
            xp: 60,
            description: '<p>To complete this quest, go for an intentional walk of at least 5 minutes. Repeat consistently for a minimum of 7 consecutive days. That’s it – just 5 minutes a day minimum!</p><p><a href="https://academy.nerdfitness.com/path/can-you-walk-to-mordor/">Click here for more info on this quest.</a></p>',
            classes: 'academy fitness rebel',
        },
        FOOD_LOG: {
            title: 'Nutrition: Create Your Food Log',
            id: 1027030,
            xp: 60,
            description: '<p>To complete this quest, complete a food log for 3 days.</p>',
            classes: 'academy nutrition',
        },
        ART_OF_GOALS: {
            title: 'Mindset: The Art of Goal Setting',
            id: 1026922,
            xp: 60,
            description: '<p>To complete this quest, you’ll need to break down your goals into at least 5 specific, measurable segments based on the examples and instructions in the Academy. Keep them specific, realistic, and easily able to say “Yah” or “Nay” at the end of the day.</p>',
            classes: 'academy mindset',
        },
        START_EPIC_QUEST: {
            title: 'Mindset: Start Your Epic Quest',
            id: 1026925,
            xp: 60,
            description: '<p>To complete this quest, take the goals you created in the “Break Down Those Goals” Quest and put them in your own personal Epic Quest (<a href="https://www.nerdfitness.com/level-up/my-epic-quest/" target="_blank">found here</a>).</p>',
            classes: 'academy mindset',
        },
        SHARE_EPIC_QUEST: {
            title: 'Mindset: Share Your Epic Quest',
            id: 1026928,
            xp: 60,
            description: '<p>To complete this quest, share your EQ profile with the people you are questing with. This could be your family, friends, or the NFA Facebook Group</p>',
            classes: 'academy mindset',
        },
        GIMME_LOOT: {
            title: 'Mindset: Gimme The Loot!',
            id: 1026931,
            xp: 25,
            description: '<p>To complete this quest, first brainstorm some healthy loot (rewards), choose a specific goal you’ve broken down and attach a realistic timeframe to it to unlock your new “loot”.</p>',
            classes: 'academy mindset',
        },
        BENCHMARK_TEST: {
            title: 'Fitness: Take the Benchmark Test',
            id: 1027303,
            xp: 25,
            description: '<p>To complete this quest, complete the benchmark test and find your starting workout.</p>',
            classes: 'academy mindset',
        },
        READ_FITNESS: {
            title: 'Fitness: Read Workouts FAQ and Getting Started and Leveling Up modules',
            id: 1027306,
            xp: 25,
            description: '<p>This is an easy one! To complete this quest, read over the Workouts FAQ and Getting Started and Leveling Up Modules</p>',
            classes: 'academy fitness',
        },
        DETERMINE_DIET_LEVEL: {
            title: 'Nutrition: Determine your starting NF Diet Level',
            id: 1027042,
            xp: 25,
            description: '<p>To complete this quest, look at your logs from the last 3 days and determine what level of the NF Diet you are</p>',
            classes: 'academy nutrition',
        },
    };
})();