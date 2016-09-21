﻿var PublicLibrariesNews = {
    locationsUrl: '/data/PLNLocations.json?v=2',
    dataUrl: '/data/PLN_YY_M_TYPE.json?v=2',
    authGeoUrl: '/data/AuthoritiesGeo.json?v=2',
    authUrl: '/data/Authorities.csv?v=2',
    authTwitterUrl: '/data/AuthoritiesTwitter.json?v=2',
    libTwitterUrl: '/data/LibrariesTwitter.json?v=2',
    librariesUrl: '/data/Libraries.csv?v=2',
    authoritiesGeo: null,
    authorities: null,
    libraries: null,
    authoritiesTwitter: null,
    librariesTwitter: null,
    locations: {},
    stories: {
        changes: {},
        local: {}
    },
    loadData: function (months, authGeo, auth, libraries, twitter, callback) {
        // Need to work out which files to load.
        // Filenames are in the form PLN_2015_11_changes
        var urls = [];
        if (authGeo) urls.push(['', '', 'authgeo', this.authGeoUrl]);
        if (auth) urls.push(['', '', 'authorities', this.authUrl]);
        if (libraries) urls.push(['', '', 'libraries', this.librariesUrl]);
        if (twitter) {
            urls.push(['', '', 'authtwitter', this.authTwitterUrl]);
            urls.push(['', '', 'libtwitter', this.libTwitterUrl]);
        }

        for (x = 0; x <= months ; x++) {
            var date = moment().subtract(x, 'months');
            var year = date.year();
            var month = date.month() + 1;
            for (type in this.stories) {
                if (!this.stories[type][year]) this.stories[type][year] = {};
                if (!this.stories[type][year][month]) {
                    this.stories[type][year][month] = {};
                    urls.push([month, year, type, this.dataUrl.replace('YY', year).replace('M', month).replace('TYPE', type)]);
                }
            }
        }
        if (Object.keys(this.locations).length == 0) urls.push(['', '', 'locations', this.locationsUrl]);
        var requests = [];
        for (i = 0; i < urls.length; i++) {
            requests.push($.ajax(urls[i][3]));
        }
        $.when.apply($, requests).done(function () {
            $.each(arguments, function (i, data) {
                var month = urls[i][0];
                var year = urls[i][1];
                var type = urls[i][2];
                if (type == 'changes' || type == 'local') this.stories[type][year][month] = data[0];
                if (type == 'locations') this.locations = data[0];
                if (type == 'libraries') this.libraries = Papa.parse(data[0], { header: true }).data;
                if (type == 'authgeo') this.authoritiesGeo = data[0];
                if (type == 'authorities') this.authorities = Papa.parse(data[0], { header: true }).data;
                if (type == 'authtwitter') this.authoritiesTwitter = data[0];
                if (type == 'libtwitter') this.librariesTwitter = data[0];
            }.bind(this));
            callback();
        }.bind(this));
    },
    getAuthorityListSorted: function () {
        return $.map(this.authorities, function (i, x) { return i.name }).sort();
    },
    getLibrariesListSorted: function (authority) {
        var libraries = this.getLibrariesByAuthority();
        return $.map(this.authorities, function (i, x) {
            if (x.name == authority || !authority) return $.map(libraries[i.name], function(y, z) { return y.name });
        }).sort();
    },
    getCountLibrariesByAuthorityType: function (authority, type) {
        $.each(this.libraries, function () {

        });
    },
    searchByPostcode: function (postcode, callback) {
        $.get('https://api.postcodes.io/postcodes/' + postcode, function (data) {
            var lat = data.result.latitude;
            var lng = data.result.longitude;
            callback({ lat: lat, lng: lng });
        });
    },
    getAuthoritiesWithStories: function () {
        var authorities = this.authorities;
        var changes = this.getStoriesGroupedByLocation('changes');
        var local = this.getStoriesGroupedByLocation('local');
        $.each(authorities, function (x, y) {
            if (changes[y.name]) authorities[x]['changes'] = changes[y.name];
            if (local[y.name]) authorities[x]['local'] = local[y.name];
        }.bind(this));
        return authorities;
    },
    getAuthoritiesWithLibraries: function () {
        var authorities = {};
        var authorityArray = this.authorities.slice().sort(function (a, b) { return a.name - b.name });
        var libraries = this.getLibrariesByAuthority();
        $.each(authorityArray, function (i, auth) {
            if (!authorities[auth['name']]) authorities[auth['name']] = { libraries: [] };
            authorities[auth['name']].libraries = libraries[auth['authority_id']];
        }.bind(this));
        return authorities;
    },
    getAuthGeoWithStories: function () {
        var authGeoData = this.authoritiesGeo;
        var changes = this.getStoriesGroupedByLocation('changes');
        var local = this.getStoriesGroupedByLocation('local');
        var totalChanges = 0;
        var totalLocal = 0;
        $.each(authGeoData.features, function (x, y) {
            if (changes[y.properties.name]) authGeoData.features[x].properties['changes'] = changes[y.properties.name];
            if (local[y.properties.name]) authGeoData.features[x].properties['local'] = local[y.properties.name];
            totalLocal = totalLocal + (local[y.properties.name] ? local[y.properties.name].stories.length : 0);
            totalChanges = totalChanges + (changes[y.properties.name] ? changes[y.properties.name].stories.length : 0);
        }.bind(this));
        $.each(authGeoData.features, function (x, y) {
            authGeoData.features[x].properties['pcLocalNews'] = (authGeoData.features[x].properties['local'] ? (authGeoData.features[x].properties['local'].stories.length / totalLocal) * 30 : 0);
            authGeoData.features[x].properties['pcChanges'] = (authGeoData.features[x].properties['changes'] ? (authGeoData.features[x].properties['changes'].stories.length / totalChanges) * 50 : 0);
        }.bind(this));
        return authGeoData;
    },
    getAuthGeoWithStoriesAndLibraries: function () {
        var authGeoData = this.getAuthGeoWithStories();
        var libs = this.getLibrariesByAuthority();
        var auth = {};
        $.each(authGeoData.features, function (x, y) {
            var nonClosedCount = 0;
            var closedCount = 0;
            var localAuthorityCount = 0;
            authGeoData.features[x].properties.libraries = {};
            $.each(libs[authGeoData.features[x].properties.authority_id], function (i, l) {
                if (!authGeoData.features[x].properties.libraries[l.type]) authGeoData.features[x].properties.libraries[l.type] = { libs: [] };
                if ((l.type != '' && l.closed == '') || l.lat != '') authGeoData.features[x].properties.libraries[l.type].libs.push(l);
                if (l.type != 'XL') nonClosedCount = nonClosedCount + 1;
                if (l.type == 'XL') closedCount = closedCount + 1;
                if (l.type == 'LAL') localAuthorityCount = localAuthorityCount + 1;
            });
            authGeoData.features[x].properties['libraryCount'] = nonClosedCount;
            authGeoData.features[x].properties['libraryCountPerPopulation'] = nonClosedCount / authGeoData.features[x].properties.population;
            authGeoData.features[x].properties['libraryCountPerArea'] = nonClosedCount / authGeoData.features[x].properties.hectares;
            authGeoData.features[x].properties['closedLibraryCount'] = closedCount;
            authGeoData.features[x].properties['lalLibraryCount'] = localAuthorityCount;
            auth[authGeoData.features[x].properties.name] = { idx: x };
        }.bind(this));
        var librariesSorted = Object.keys(auth).sort(function (a, b) {
            return authGeoData.features[auth[b].idx].properties.lalLibraryCount - authGeoData.features[auth[a].idx].properties.lalLibraryCount;
        });
        var librariesPerPopulationSorted = Object.keys(auth).sort(function (a, b) {
            return authGeoData.features[auth[b].idx].properties.libraryCountPerPopulation - authGeoData.features[auth[a].idx].properties.libraryCountPerPopulation;
        });
        var librariesPerAreaSorted = Object.keys(auth).sort(function (a, b) {
            return authGeoData.features[auth[b].idx].properties.libraryCountPerArea - authGeoData.features[auth[a].idx].properties.libraryCountPerArea;
        });
        var authLALSorted = Object.keys(auth).sort(function (a, b) {
            var a = authGeoData.features[auth[a].idx].properties.libraries;
            var b = authGeoData.features[auth[b].idx].properties.libraries;
            return (b['LAL'] ? b['LAL'].libs.length : 0) - (a['LAL'] ? a['LAL'].libs.length : 0);
        });
        var closedLibrariesSorted = Object.keys(auth).sort(function (a, b) {
            return authGeoData.features[auth[b].idx].properties.closedLibraryCount - authGeoData.features[auth[a].idx].properties.closedLibraryCount;
        });
        $.each(authGeoData.features, function (x, y) {
            authGeoData.features[x].properties['pcLibraries'] = librariesSorted.indexOf(y.properties.name) / Object.keys(librariesSorted).length.toFixed(1);
            authGeoData.features[x].properties['pcLibrariesPerPopulation'] = librariesPerPopulationSorted.indexOf(y.properties.name) / Object.keys(librariesPerPopulationSorted).length.toFixed(1);
            authGeoData.features[x].properties['pcLibrariesPerArea'] = librariesPerAreaSorted.indexOf(y.properties.name) / Object.keys(librariesPerAreaSorted).length.toFixed(1);
            authGeoData.features[x].properties['pcClosedLibraries'] = closedLibrariesSorted.indexOf(y.properties.name) / Object.keys(closedLibrariesSorted).length.toFixed(1);
            authGeoData.features[x].properties['pcLalLibraries'] = authLALSorted.indexOf(y.properties.name) / Object.keys(authLALSorted).length.toFixed(1);
            
        }.bind(this));
        return authGeoData;
    },
    getLibrariesByAuthority: function () {
        var authLibraries = {};
        $.each(this.libraries, function (i, lib) {
            if (!authLibraries[lib['authority_id']]) authLibraries[lib['authority_id']] = [];
            if (lib.type == '') lib.type = 'XL';
            authLibraries[lib['authority_id']].push(lib);
        }.bind(this));
        return authLibraries;
    },
    getLibraryLocations: function () {
        var libArray = [];
        $.each(this.libraries, function (i, lib) {
            if (lib.type != '' && lib.type != 'XL' && lib.lat && lib.lng && lib.lat != '' && lib.lng != '') libArray.push(L.latLng(lib.lat, lib.lng));
        }.bind(this));
        return libArray;
    },
    getLatestAuthorityTweet: function (auth) {
        var tweet = null;
        $.each(this.authoritiesTwitter, function (i, t) {
            if (t[0].toLowerCase().replace('county council', '').trim() == auth.toLowerCase().replace('county council', '').trim()) tweet = t;
        }.bind(this));
        return tweet;
    },
    getLatestLibraryTweet: function (lib) {
        var tweet = null;
        $.each(this.librariesTwitter, function (i, t) {
            if (t[0].toLowerCase() == lib.toLowerCase()) tweet = t;
        }.bind(this));
        return tweet;
    },
    getStoriesGroupedByLocation: function (type) {
        var locs = {};
        $.each(this.stories[type], function (i, y) {
            $.each(y, function (x, m) {
                $.each(m, function (z, s) {
                    if (!locs[s[0]]) locs[s[0]] = { lat: this.locations[s[0]][0], lng: this.locations[s[0]][1], stories: [] };
                    locs[s[0]].stories.push({ date: s[1], text: s[2], url: s[3] });
                }.bind(this));
            }.bind(this));
        }.bind(this));
        return locs;
    },
    storyCount: function (type) {
        var count = 0;
        $.each(this.stories[type], function (i, y) {
            $.each(y, function (x, m) {
                count = count + m.length;
            }.bind(this));
        }.bind(this));
        return count;
    },
    locationsSortedByCount: function (type) {
        var locsObj = {};
        var locs = [];
        $.each(this.stories[type], function (i, y) {
            $.each(y, function (x, m) {
                $.each(m, function (z, s) {
                    if (!locsObj[s[0]]) locsObj[s[0]] = { count: 0 };
                    locsObj[s[0]].count = locsObj[s[0]].count + 1;
                }.bind(this));
            }.bind(this));
        }.bind(this));
        $.each(Object.keys(locsObj), function (i, y) {
            locs.push(y);
        });
        locs.sort(function (a, b) {
            return locsObj[b].count - locsObj[a].count;
        })
        return locs;
    },
    storyCountByMonth: function () {
        var data = [];
        var months = {};
        $.each(this.stories, function (i, t) {
            // types
            $.each(t, function (x, y) {
                // years
                $.each(y, function (z, m) {
                    if (!months[x + '-' + z]) months[x + '-' + z] = {};
                    months[x + '-' + z][i] = m.length;
                });
            });
        });
        $.each(months, function (x, d) {
            var obj = { month: x };
            $.each(d, function (k, v) {
                obj[k] = v;
            });
            data.push(obj)
        });
        return data;
    }
};