'use strict';

/* ===== LIVE BANNER: dynamic viewer count + date ===== */
(function initBanner() {
    try {
        var countEl = document.getElementById('viewer-count');
        var dateEl = document.getElementById('live-date');
        if (countEl) countEl.textContent = Math.floor(Math.random() * 13) + 22;
        if (dateEl) {
            var d = new Date();
            var months = ['January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'];
            dateEl.textContent = months[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear();
        }
    } catch (e) { console.warn('[Banner]', e); }
})();

/* ===== SCARCITY: random bottles left ===== */
(function initScarcity() {
    try {
        var el = document.getElementById('bottles-left');
        if (el) el.textContent = Math.floor(Math.random() * 13) + 22;
    } catch (e) { console.warn('[Scarcity]', e); }
})();

/* ===== PURCHASE NOTIFICATIONS ===== */
/* Multi-signal detection: we try every method to detect VTurb's pitch moment.
   The flag `started` ensures notifications only fire once regardless of which
   signal triggers first. */
(function initNotifications() {
    try {
        var started = false;
        var names = ["Patricia", "Jennifer", "Linda", "Elizabeth", "Barbara", "Susan", "Jessica",
            "Sarah", "Karen", "Lisa", "Nancy", "Betty", "Margaret", "Sandra", "Ashley", "Kimberly",
            "Emily", "Donna", "Michelle", "Carol", "Amanda", "Dorothy", "Melissa", "Deborah",
            "Stephanie", "Rebecca", "Sharon", "Laura", "Cynthia", "Kathleen", "Amy", "Angela",
            "Shirley", "Anna", "Brenda", "Pamela", "Emma", "Nicole", "Helen", "Samantha",
            "Christine", "Debra", "Rachel", "Carolyn", "Janet", "Catherine", "Maria", "Heather",
            "Diane", "Ruth", "Julie", "Olivia", "Joyce", "Virginia", "Victoria", "Kelly", "Lauren",
            "Christina", "Joan", "Evelyn", "Judith", "Megan", "Andrea", "Cheryl", "Hannah",
            "Jacqueline", "Martha", "Gloria", "Teresa", "Ann", "Sara", "Madison", "Jean", "Kathryn",
            "Janice", "Abigail", "Alice", "Julia", "Judy", "Sophia", "Grace", "Denise", "Amber",
            "Doris", "Marilyn", "Danielle", "Beverly", "Isabella", "Theresa", "Diana", "Natalie",
            "Brittany", "Charlotte", "Marie", "Kayla", "Alexis", "Lori"];
        var cities = ["London", "Manchester", "Birmingham", "Leeds", "Glasgow",
            "Liverpool", "Edinburgh", "Bristol", "Cardiff", "Belfast"];
        var snackbar = document.getElementById('snackbar');

        function showNotif() {
            if (!snackbar) return;
            var name = names[Math.floor(Math.random() * names.length)];
            var city = cities[Math.floor(Math.random() * cities.length)];
            snackbar.innerHTML = '<strong>' + name + '</strong> from ' + city + ' just purchased!';
            snackbar.classList.add('show');
            setTimeout(function () { snackbar.classList.remove('show'); }, 4000);
        }

        function startNotifications() {
            if (started) return;
            started = true;
            setTimeout(showNotif, 3000);
            setInterval(showNotif, 12000);
        }

        var pitchEl = document.querySelector('#pitch-section');
        if (!pitchEl) return;

        /* ------ METHOD 1: MutationObserver on pitch element ------
           VTurb may set inline style "display:none" and then remove it,
           or change classes at the pitch moment. */
        var styleObs = new MutationObserver(function (mutations) {
            mutations.forEach(function (m) {
                if (m.attributeName === 'style') {
                    var display = window.getComputedStyle(pitchEl).display;
                    if (display !== 'none') {
                        startNotifications();
                    }
                }
                if (m.attributeName === 'class') {
                    startNotifications();
                }
            });
        });
        styleObs.observe(pitchEl, { attributes: true, attributeFilter: ['style', 'class'] });

        /* ------ METHOD 2: Intercept scrollIntoView at prototype level ------ */
        var nativeScrollIntoView = Element.prototype.scrollIntoView;
        Element.prototype.scrollIntoView = function () {
            if (this.classList && this.classList.contains('smartplayer-scroll-event')) {
                startNotifications();
            }
            return nativeScrollIntoView.apply(this, arguments);
        };

        /* ------ METHOD 3: Intercept window.scrollTo / window.scroll ------
           VTurb might use window.scrollTo instead of scrollIntoView. 
           We check if the scroll target is near the pitch element. */
        var nativeScrollTo = window.scrollTo;
        window.scrollTo = function () {
            nativeScrollTo.apply(window, arguments);
            // After scrolling, check if pitch section is now in viewport
            var rect = pitchEl.getBoundingClientRect();
            if (rect.top >= -200 && rect.top <= window.innerHeight) {
                startNotifications();
            }
        };
        var nativeScroll = window.scroll;
        window.scroll = function () {
            nativeScroll.apply(window, arguments);
            var rect = pitchEl.getBoundingClientRect();
            if (rect.top >= -200 && rect.top <= window.innerHeight) {
                startNotifications();
            }
        };

        /* ------ METHOD 4: postMessage fallback ------ */
        window.addEventListener('message', function (e) {
            try {
                var d = e.data;
                if (!d) return;
                if (
                    (typeof d === 'string' && d.indexOf('scrollEvent') !== -1) ||
                    (typeof d === 'object' && d.type === 'scrollEvent')
                ) {
                    startNotifications();
                }
            } catch (err) { /* ignore */ }
        });

        /* ------ METHOD 5: Visibility polling (ultimate fallback) ------
           Poll every 2s — if pitch element was hidden and is now visible,
           that's the pitch moment. Stops polling once triggered. */
        var wasHidden = true;
        var pollId = setInterval(function () {
            if (started) { clearInterval(pollId); return; }
            var cs = window.getComputedStyle(pitchEl);
            var isHidden = (cs.display === 'none' || cs.visibility === 'hidden' || cs.opacity === '0');
            if (wasHidden && !isHidden) {
                // Was hidden, now visible — pitch happened
                // But only trigger if it was actually hidden before (not just on load)
            }
            wasHidden = isHidden;
            // If element becomes visible AND page has scrolled past video section
            if (!isHidden && window.scrollY > 400) {
                startNotifications();
                clearInterval(pollId);
            }
        }, 2000);

    } catch (e) { console.warn('[Notifications]', e); }
})();
