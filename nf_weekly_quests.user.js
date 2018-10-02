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

    function addStyle(css) {
        const style = document.createElement('style');
        style.type = 'text/css';
        style.textContent = css;
        document.head.appendChild(style);
    }

    addStyle(`
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

    function questBox(title, id, xp, description, classes, completed, starred) {
        const statusImage = completed ?
            'https://www.nerdfitness.com/wp-content/themes/NerdFitness/templates/images/graphics-00092.png' :
            'https://www.nerdfitness.com/wp-content/themes/NerdFitness/templates/images/graphics-00090.png';
        const completeButtonText = completed ? 'MARK NOT COMPLETE' : 'MARK COMPLETED!';
        const completeButtonImage = completed ?
            'https://www.nerdfitness.com/wp-content/themes/NerdFitness/templates/images/graphics-00031.png' :
            'https://www.nerdfitness.com/wp-content/themes/NerdFitness/templates/images/graphics-00014.png';
        const starredClasses = 'qh-star ' + (starred ? 'active' : '');

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
                            <div class="${starredClasses}" data-id="${id}"></div>
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

    let statusesPromise = undefined;

    if (weeklyQuestsPage()) {
        console.log('Replace page');
        document.title = 'Weekly Quests';

        statusesPromise = getQuestStatuses();
    }

    console.log('NF Weekly Quests');
    console.log('location.href', window.location.href);
    console.log('document.referrer', document.referrer);

    function generateQuestBoxesHtml(questStatuses) {
        let questBoxesHtml = '';

        WEEKLY_QUESTS.forEach(week => {
            questBoxesHtml += '\n<h2>' + week.title + '</h2>\n';

            week.quests.forEach(questKey => {
                questBoxesHtml += '<div>';
                questBoxesHtml += questBox(
                    QUESTS[questKey].title,
                    QUESTS[questKey].id,
                    QUESTS[questKey].xp,
                    QUESTS[questKey].description,
                    QUESTS[questKey].classes,
                    questStatuses[QUESTS[questKey].id].complete,
                    questStatuses[QUESTS[questKey].id].starred,
                );
                questBoxesHtml += '</div>\n';
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
            if (!statusesPromise) {
                return;
            }

            statusesPromise.then(questStatuses => {
                document.querySelector('#navlist .nav-my-quests').classList.remove('current-menu-item');
                document.querySelector('#navlist .nav-weekly-quests').classList.add('current-menu-item');
                document.querySelector('.fx-content-title').innerHTML = 'Weekly Quests';
                document.querySelector('.fx-inner-cont').innerHTML = generateQuestBoxesHtml(questStatuses);

                document.querySelector('.progress-big').remove();
                document.querySelector('.qh-showhide').remove();
            });
        }
    });

    function getQuestStatuses() {
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
                            let starred = false;

                            if (quest.indexOf('q-complete') > 0) {
                                complete = true;
                            }

                            if (quest.indexOf('qh-star active') > 0) {
                                starred = true;
                            }

                            if (id !== '') {
                                reduced[id] = {
                                    complete,
                                    starred,
                                };
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

        return statusPromise;
    }

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
        {
            title: 'Week Three',
            quests: [
                'BATCAVE_1',
                'DREAM_TEAM',
                'NO_LIQUID_CALORIES',
                'WARMUP',
                'COOLDOWN',
            ],
        },
        {
            title: 'Week Four',
            quests: [
                'INSPIRATION',
                'RECIPE_1',
                'WORKOUT_SCHEDULE',
                'TRY_WORKOUT',
            ],
        },
        {
            title: 'Week Five',
            quests: [
                'DURING_PHOTOS_1',
                'NO_TIME',
                'SUGAR_BEAST_1',
            ],
        },
        {
            title: 'Week Six',
            quests: [
                'BATCAVE_2',
                'CAFFEINE_1',
                'RECIPE_2',
                'BOSS_DOMS',
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
        BATCAVE_1: {
            title: 'Mindset: NaNaNaNaNa BATCAVE!',
            id: 1026934,
            xp: 40,
            description: '<p>To complete this quest, you’ll need to make 3 new changes to your daily environment that will remove steps to build a new healthy habit you’ve selected. You’ll also need to add 3 new barriers into your life to keep you from falling back on a old unhealthy habit you are replacing or limiting.</p>',
            classes: 'academy mindset',
        },
        DREAM_TEAM: {
            title: 'Mindset: Build Your Dream Team',
            id: 1026943,
            xp: 40,
            description: '<p>To complete this quest, brainstorm an accountabilibuddy or two, identify larger groups of friends that can help lift you up, and learn the best ways to take advantage of the Nerd Fitness Community.</p>',
            classes: 'academy mindset',
        },
        NO_LIQUID_CALORIES: {
            title: 'Nutrition: Don\'t drink liquid calories',
            id: 1027057,
            xp: 60,
            description: '<p>To complete this quest, do not consume any liquid that contains calories for one week. You can still have soda if it is diet soda, and you can still have coffee or tea if it does not contain cream or sugar.</p>',
            classes: 'academy nutrition',
        },
        WARMUP: {
            title: 'Fitness: Warm It Up',
            id: 1027282,
            xp: 40,
            description: '<p>Choose one of our basic warm-up routines and practice each exercise. Modify any exercises that you need. Log your new modified warm-up somewhere accessible (workout journal, phone, etc…). Once you’ve practiced all the exercises at least once. You’ve completed the challenge!</p>',
            classes: 'academy fitness',
        },
        COOLDOWN: {
            title: 'Fitness: Cool It Down',
            id: 1027285,
            xp: 40,
            description: '<p>Start with Staci’s basic Cool-Down Routine and PDFs. Practice each stretch in order. Modify any stretches you can’t do or select an alternative option from Steve’s alternative video. Log your new modified cool-down someplace accessible. Once you’ve done this, you’ve completed this quest too!</p>',
            classes: 'academy fitness',
        },
        INSPIRATION: {
            title: 'Mindset: What Inspires You?',
            id: 1026949,
            xp: 25,
            description: '<p>To complete this quest, think of one thing that inspires you, write it down on a piece of paper, print it out, draw a picture, make a collage, whatever!  Then put it where you can see it/read it often – on your bedroom door, bathroom mirror, or computer screen are great options.</p>',
            classes: 'academy mindset',
        },
        RECIPE_1: {
            title: 'Nutrition: Try a Nerd Fitness Recipe #1',
            id: 1027063,
            xp: 25,
            description: '<p>To complete this quest, try a recipe from the Nerd Fitness recipe book!</p>',
            classes: 'academy nutrition',
        },
        WORKOUT_SCHEDULE: {
            title: 'Fitness: Schedule Your Workout Reminders',
            id: 1027279,
            xp: 25,
            description: '<p>To complete this quest, Find your starting workout plan and identify how many workouts are in it (AB, ABC, or ABCD). Schedule at least the next 4 weeks in your calender, filling in each day with the letter of the workout (based on your plan). Set reminders in your phone or email to remind you the night before each workout and an hour before each workout.</p>',
            classes: 'academy fitness',
        },
        TRY_WORKOUT: {
            title: 'Fitness: Complete your first workout',
            id: 1027342,
            xp: 25,
            description: '<p>To complete this quest, complete your first workout after the benchmark test.</p>',
            classes: 'academy fitness',
        },
        DURING_PHOTOS_1: {
            title: 'Mindset: Take Your During Photos and Measurements #1',
            id: 1026872,
            xp: 25,
            description: '<p>This is a repeat of the "Snap Those Before Photos!" Quest – only to be completed one month into your journey.</p>',
            classes: 'academy mindset',
        },
        NO_TIME: {
            title: 'Mindset: I Don\'t Have Time',
            id: 1026952,
            xp: 40,
            description: '<p>To complete this quest, take a look at three things you usually say you don’t have time for, and switch the phrase "I don\'t have time" to "It\'s not a priority". Think about how you can adjust your priorities – and make your new goals a priority!</p>',
            classes: 'academy mindset',
        },
        SUGAR_BEAST_1: {
            title: 'Nutrition: Defeat the Sugar Beast #1',
            id: 1027081,
            xp: 60,
            description: '<p>Steps to complete this Sugar Level 1 quest:  First, make sure you are well stocked with a couple of your favorite fruits. Second, whenever you feel a sugar craving from candy, chocolate, dessert, sugary drinks, etc – reach for and consume your favorite fruit instead. Defeat 5 cravings in this manner and you’ve completed this quest. For this stage of our process, we are going to accept the sugar in the fruit consumption as a healthy alternative in order to establish better habits and routines around food and sugar in general.</p>',
            classes: 'academy nutrition',
        },
        BATCAVE_2: {
            title: 'Mindset: NaNaNaNaNa BATCAVE! #2',
            id: 1026937,
            xp: 25,
            description: '<p>To complete this quest, make another upgrade to your home that makes it easier to maintain the new habits you’ve been building. This quest should be completed at least one month after the previous Batcave quest and after those changes are now standard.</p>',
            classes: 'academy mindset',
        },
        CAFFEINE_1: {
            title: 'Nutrition: I Can’t Live Without Caffeine #1',
            id: 1027090,
            xp: 40,
            description: '<p>To complete this quest, first, find your alternative to caffeinated drinks. This may mean seeking out and trying several types and varieties of decaf black coffee and tea. Find something that you can at least start substituting as an alternative.</p>',
            classes: 'academy nutrition',
        },
        RECIPE_2: {
            title: 'Nutrition: Try a Nerd Fitness Recipe #2',
            id: 1027066,
            xp: 25,
            description: '<p>Try two new Nerd Fitness recipes. Choose from the Nerd Fitness Recipes page.</p>',
            classes: 'academy nutrition',
        },
        BOSS_DOMS: {
            title: 'Fitness: Defeat Boss: General DOMS',
            id: 1027247,
            xp: 25,
            description: '<p>To complete this quest, you need to defeat the Bodyweight Level 1 workout boss, General DOMS!</p>',
            classes: 'academy fitness',
        },
    };
})();