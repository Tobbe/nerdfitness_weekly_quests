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

    function questBox(title, id, xp, description, classes) {
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
                            <div class="qh-rect">${xp} xp<img style="float: right;" src="https://www.nerdfitness.com/wp-content/themes/NerdFitness/templates/images/graphics-00092.png"></div>
                        </div>
                    </div>
                    <div class="quest-body-block">
                        <div class="col-sm-6"><img src="https://www.nerdfitness.com/wp-content/uploads/2016/07/nfq-academy.jpg"></div>
                        <div class="col-sm-6">
                            <div style="padding: 0 10px;">
                                <p></p>
                                ${description}
                                <p></p>
                                <div data-id="${id}" class="qh-complete" style="background-image: url(https://www.nerdfitness.com/wp-content/themes/NerdFitness/templates/images/graphics-00031.png);">MARK NOT COMPLETE</div>
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

    document.addEventListener('DOMContentLoaded', function(event) {
        console.log('DOM fully loaded and parsed');

        if (loggedInPage()) {
            console.log('logged in page');
            addMenuItem();
        }

        if (weeklyQuestsPage()) {
            document.querySelector('#navlist .nav-my-quests').classList.remove('current-menu-item');
            document.querySelector('#navlist .nav-weekly-quests').classList.add('current-menu-item');
            document.querySelector('.fx-content-title').innerHTML = 'Weekly Quests';
            document.querySelector('.fx-inner-cont').innerHTML = `
                <h2>Week One</h2>
                <div>${questBox(QUESTS.BEFORE_PHOTOS.title, QUESTS.BEFORE_PHOTOS.id, QUESTS.BEFORE_PHOTOS.xp, QUESTS.BEFORE_PHOTOS.description, QUESTS.BEFORE_PHOTOS.classes)}</div>
                <div>${questBox(QUESTS.MEASUREMENTS.title, QUESTS.MEASUREMENTS.id, QUESTS.MEASUREMENTS.xp, QUESTS.MEASUREMENTS.description, QUESTS.MEASUREMENTS.classes)}</div>
                <div>${questBox(QUESTS.FIND_BIG_WHY.title, QUESTS.FIND_BIG_WHY.id, QUESTS.FIND_BIG_WHY.xp, QUESTS.FIND_BIG_WHY.description, QUESTS.FIND_BIG_WHY.classes)}</div>
                <div>${questBox(QUESTS.SHARE_BIG_WHY.title, QUESTS.SHARE_BIG_WHY.id, QUESTS.SHARE_BIG_WHY.xp, QUESTS.SHARE_BIG_WHY.description, QUESTS.SHARE_BIG_WHY.classes)}</div>
                <div>${questBox(QUESTS.WALK_TO_MORDOR.title, QUESTS.WALK_TO_MORDOR.id, QUESTS.WALK_TO_MORDOR.xp, QUESTS.WALK_TO_MORDOR.description, QUESTS.WALK_TO_MORDOR.classes)}</div>
                <div>${questBox(QUESTS.FOOD_LOG.title, QUESTS.FOOD_LOG.id, QUESTS.FOOD_LOG.xp, QUESTS.FOOD_LOG.description, QUESTS.FOOD_LOG.classes)}</div>
            `;

            document.querySelector('.progress-big').remove();
            document.querySelector('.qh-showhide').remove();
        }
    });

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
            classes: 'academy mindset',
        },
        FOOD_LOG: {
            title: 'Nutrition: Create Your Food Log',
            id: 1027030,
            xp: 60,
            description: '<p>To complete this quest, complete a food log for 3 days.</p>',
            classes: 'academy fitness rebel',
        },
    };
})();