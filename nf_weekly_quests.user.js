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
        document.title = 'Weekly Quests';

        statusesPromise = getQuestStatuses();
    }

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
        if (loggedInPage()) {
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
        const URL = `
            https://www.nerdfitness.com/wp-admin/admin-ajax.php?
                action=alm_query_posts&
                query_type=standard&
                nonce=6bc113fe44&
                repeater=default&
                theme_repeater=null&
                cta=&
                comments=&
                post_type%5B%5D=nfq_quest&
                post_format=&
                category=&
                category__not_in=&
                tag=&
                tag__not_in=&
                taxonomy=nfq_quest_category&
                taxonomy_terms=academy&
                taxonomy_operator=&
                taxonomy_relation=&
                meta_key=&
                meta_value=&
                meta_compare=&
                meta_relation=&
                meta_type=&
                author=&
                year=&
                month=&
                day=&
                post_status=&
                order=DESC&
                orderby=date&
                post__in=&
                post__not_in=&
                exclude=&
                search=&
                custom_args=&
                posts_per_page=1500&
                page=0&
                offset=0&
                preloaded=false&
                seo_start_page=1&
                paging=false&
                previous_post=false&
                previous_post_id=&
                previous_post_taxonomy=&
                lang=&
                slug=my-quests&
                canonical_url=
                    https%3A%2F%2Fwww.nerdfitness.com%2F
                        level-up%2Fmy-quests%2F`
                .replace(/\s+/g, '');

        const statusPromise = new Promise((resolve, reject) => {
            fetch(URL)
                .then(data => data.json())
                .then(res => {
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
        {
            title: 'Week Seven',
            quests: [
                'COURAGE_20_SECONDS',
                'STOP_SLOUCHING_WALL_CHALLENGE',
                'ALCOHOL',
                'DIET_LEVEL_2',
            ],
        },
        {
            title: 'Week Eight',
            quests: [
                'SLEEP_JOURNAL',
                'SMILE_MORE',
                'HATE_VEGETABLES_1',
                'JUMP_ROPE_1',
            ],
        },
        {
            title: 'Week Nine',
            quests: [
                'BATCAVE_3',
                'DURING_PHOTOS_2',
                'SUGAR_BEAST_2',
                'CHECK_LABEL',
            ],
        },
        {
            title: 'Week Ten',
            quests: [
                'CONFIDENT',
                'RECIPE_3',
                'SPICES',
                'GROCERY_STORE',
            ],
        },
        {
            title: 'Week Eleven',
            quests: [
                'DIET_LEVEL_3',
                'CAFFEINE_2',
                'CONVERSATION_STARTER',
                'GYM_WORKOUT',
                'HOME_WORKOUT',
            ],
        },
        {
            title: 'Week Twelve',
            quests: [
                'BATCAVE_4',
                'MEDITATION_CHALLENGE',
                'IDENTIFY_DEMONS',
                'NERD_FITNESS_PANTRY',
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
        COURAGE_20_SECONDS: {
            title: 'Mindset: 20 Seconds of Courage?',
            id: 1026946,
            xp: 100,
            description: '<p>To complete this quest, do one thing that you have always wanted to do but were too scared – no matter how small! This could be signing up to run a 5k or asking someone out on a date! 20 seconds of courage!</p>',
            classes: 'academy mindset',
        },
        STOP_SLOUCHING_WALL_CHALLENGE: {
            title: 'Mindset: Stop Slouching Wall Challenge',
            id: 1026970,
            xp: 25,
            description: '<p>Start by standing with your heels, butt, and head against a wall. Pull your shoulder blades back until they’re touching the wall too. Do this for 30 seconds in the morning and the evening for one week to get started!</p>',
            classes: 'academy mindset',
        },
        ALCOHOL: {
            title: 'Nutrition: Can I Still Drink Alcohol?',
            id: 1027099,
            xp: 40,
            description: '<p>To complete this quest, follow the steps listed in the Alcohol page to develop a healthy plan for drinking for: 1. Every Day 2. The next party you are going to.</p>',
            classes: 'academy nutrition',
        },
        DIET_LEVEL_2: {
            title: 'Nutrition: NF Diet Level 2',
            id: 1027135,
            xp: 25,
            description: '<p>To complete this quest, eat at the NF Diet Level 2 for at least one week.</p>',
            classes: 'academy nutrition',
        },
        SLEEP_JOURNAL: {
            title: 'Mindset: Keep a Sleep Journal',
            id: 1026955,
            xp: 25,
            description: '<p>To complete this quest, keep a sleep journal for one week.</p>',
            classes: 'academy mindset',
        },
        SMILE_MORE: {
            title: 'Mindset: Smile More',
            id: 1026982,
            xp: 25,
            description: '<p>To complete this quest, harness the power of your smile and use it to power up your confidence! 5 times a day for the next week, remind yourself to smile. Thinking of your most recent big win or a happy memory can help (just like summoning a patronus)! To practice smiling a friendly, genuine smile stand in front of a mirror, close your eyes, and look down. Look up, smile, and open your eyes at the same time.</p>',
            classes: 'academy mindset',
        },
        HATE_VEGETABLES_1: {
            title: 'Nutrition: I Hate Vegetables #1',
            id: 1027111,
            xp: 40,
            description: '<p>To complete this quest, eat a vegetable at least once a day for a week.</p>',
            classes: 'academy nutrition',
        },
        JUMP_ROPE_1: {
            title: 'Fitness: Jump Rope #1',
            id: 1027309,
            xp: 25,
            description: '<p>To complete this quest, jump rope (single unders) for 30 seconds without stopping.</p>',
            classes: 'academy fitness',
        },
        BATCAVE_3: {
            title: 'Mindset: NaNaNaNaNa BATCAVE! #3',
            id: 1026940,
            xp: 25,
            description: '<p>To complete this quest, make another upgrade to your home that makes it easier to maintain the new habits you’ve been building. This quest should be completed at least one month after the previous Batcave quest and after those changes are now standard.</p>',
            classes: 'academy mindset',
        },
        DURING_PHOTOS_2: {
            title: 'Mindset: Take Your During Photos and Measurements #2',
            id: 1026875,
            xp: 25,
            description: '<p>This is a repeat of the “Snap Those Before Photos!” Quest – only to be completed two months into your journey.</p>',
            classes: 'academy mindset',
        },
        SUGAR_BEAST_2: {
            title: 'Nutrition: Defeat the Sugar Beast #2',
            id: 1027084,
            xp: 120,
            description: '<p>To complete this quest: In addition to your food log, start noting how much sugar you are consuming (counting your fruit of course) for at least one week. Consult a list of low sugar fruits and compare your current food log to the table. Identify alternatives fruits to replace the ones in your diet with the highest sugar content.</p>',
            classes: 'academy nutrition',
        },
        CHECK_LABEL: {
            title: 'Nutrition: Check the Label',
            id: 1027051,
            xp: 25,
            description: '<p>Check the label of everything you consume for one week to look at portion sizes and ingredients.</p>',
            classes: 'academy nutrition',
        },
        CONFIDENT: {
            title: 'Mindset: What are you confident in?',
            id: 1026991,
            xp: 25,
            description: '<p>To complete this quest, think about what you are most confident in right now. What do people compliment you on the most? Once you’ve figured this out, make a statement about yourself based on the impression you want to give to other people. For example, if people have complimented your laugh, you could remind yourself that: "I\'m a happy person. People notice that and enjoy being around me because that feeling is contagious."</p>',
            classes: 'academy mindset',
        },
        RECIPE_3: {
            title: 'Nutrition: Try a Nerd Fitness Recipe #3',
            id: 1027069,
            xp: 25,
            description: '<p>Round 3! Try two new Nerd Fitness recipes or experiment with an old one. Choose from the Nerd Fitness Recipes page.</p>',
            classes: 'academy nutrition',
        },
        SPICES: {
            title: 'Nutrition: Spice Things Up!',
            id: 1027126,
            xp: 25,
            description: '<p>To complete this quest, choose spices from “the core six” and add them to a meal you are making.</p>',
            classes: 'academy nutrition',
        },
        GROCERY_STORE: {
            title: 'Nutrition: Navigate a Grocery Store',
            id: 1027102,
            xp: 40,
            description: '<p>To complete this quest, create a grocery store map to help you navigate the store!</p>',
            classes: 'academy nutrition',
        },
        DIET_LEVEL_3: {
            title: 'Nutrition: NF Diet Level 3',
            id: 1027138,
            xp: 25,
            description: '<p>To complete this quest, eat at the NF Diet Level 3 for at least one week.</p>',
            classes: 'academy nutrition',
        },
        CAFFEINE_2: {
            title: 'Nutrition: I Can’t Live Without Caffeine #2',
            id: 1027093,
            xp: 75,
            description: '<p>Two days a week (pick and schedule which days), you will only drink caffeine from your new alternative support. After a few weeks, step this up to 3-4 times a week.</p>',
            classes: 'academy nutrition',
        },
        CONVERSATION_STARTER: {
            title: 'Mindset: Conversation Starter',
            id: 1026988,
            xp: 60,
            description: '<p>To complete this quest, start 3 conversations with strangers. Don’t give yourself more than 3 seconds before approaching and saying hello – get the awkwardness out of the way immediately, and you’ll come across as cool and collected!  Try talking to cashiers, people sharing an elevator with you, strangers at a party, or people waiting in line beside you. If you feel out of place in a situation, everybody around you probably does too – they might even be secretly grateful that you were confident enough to break the ice!</p>',
            classes: 'academy mindset',
        },
        GYM_WORKOUT: {
            title: 'Fitness: Complete a Gym Workout',
            id: 1027300,
            xp: 25,
            description: '<p>Complete one of your workouts (from your path) at a local Gym. If you don’t have a membership, visit a gym for a free trial! </p>',
            classes: 'academy fitness',
        },
        HOME_WORKOUT: {
            title: 'Fitness: Complete a Home Workout',
            id: 1027288,
            xp: 25,
            description: '<p>Complete one of your scheduled workouts in the comfort of your own home. If you are doing the gym workouts and don’t have the gear at home, switch and do a workout from the bodyweight path at home in place of one of your workouts.</p>',
            classes: 'academy fitness',
        },
        BATCAVE_4: {
            title: 'Mindset: NaNaNaNaNa BATCAVE! #4',
            id: 1026964,
            xp: 25,
            description: '<p>To complete this quest, make another upgrade to your home that makes it easier to maintain the new habits you’ve been building. This quest should be completed at least one month after the previous Batcave quest and after those changes are now standard.</p>',
            classes: 'academy mindset',
        },
        MEDITATION_CHALLENGE: {
            title: 'Mindset: Meditation Challenge',
            id: 1027012,
            xp: 60,
            description: '<p>Today we’re issuing a meditation challenge: Commit to meditating every day, for two weeks straight (using an app, website, or guided meditation if you wish). It can just be for five minutes. Or two minutes. The important part is establishing the new habit.</p>',
            classes: 'academy mindset',
        },
        IDENTIFY_DEMONS: {
            title: 'Mindset: Identify Your Demons',
            id: 1027000,
            xp: 40,
            description: '<p>To complete this quest, identify the battle you’d like to tackle with the skywalker method. What is it? Take a deep look and figure out what you’d like to change.  This part can suck &mdash; it requires 100% honesty with yourself and owning up to what’s really at the root of the issue.</p>',
            classes: 'academy mindset',
        },
        NERD_FITNESS_PANTRY: {
            title: 'Nutrition: Try the Nerd Fitness Pantry',
            id: 1027129,
            xp: 25,
            description: '<p>To complete this quest, go through the Level Up Your Pantry and bring your pantry to the next level (If Level 0, bring it to Level 1 – if already at level 1, bring to level 2)</p>',
            classes: 'academy nutrition',
        },
    };
})();
