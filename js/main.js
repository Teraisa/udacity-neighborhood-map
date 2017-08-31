(function mainJS(global, doc, $) {
    "use strict";
    const CLIENTID = "V443OTCAQPJLCRY4QWBFYN3ZK5FDKGJOYDHLMI3O342IRVNN",
        CLIENTSECRET = "AK1JHLEG2D2KW14WF5HYVFNTUYFTBXYS4LDUUNRAHPR5URLB",
        US_PHONE_LEN = 10,
        errorBox = doc.querySelector('#dangerBox');

    let initialLocations = [
            {
                name: 'Bracher Park',
                lat: 37.370,
                long: -122.002
            },
            {
                name: 'Hacker Dojo (old)',
                lat: 37.402,
                long: -122.052
            },
            {
                name: 'Hacker Dojo (current)',
                lat: 37.381,
                long: -121.961
            },
            {
                name: 'Red Rock Coffee',
                lat: 37.393,
                long: -122.081
            },
            {
                name: 'Com Tam Thanh (Broken Rice)',
                lat: 37.309,
                long: -121.934
            },
            {
                name: 'House of Falafel',
                lat: 37.322,
                long: -122.018
            },
            {
                name: 'The Prolific Oven',
                lat: 37.394,
                long: -121.948
            },
            {
                name: 'Pho Mai #1 Noodle House',
                lat: 37.415,
                long: -121.878
            },
            {
                name: 'Alviso Marina County Park',
                lat: 37.429,
                long: -121.984
            },
            {
                name: 'Peet\'s Coffee (aka "Church")',
                lat: 37.307,
                long: -121.900
            }

        ],
        errorHandler = (currentErr) => {
            errorBox.classList.remove('is-hidden');
            let div = doc.createElement('DIV');
            div.innerHTML = currentErr;
            errorBox.appendChild(div);
        },
        map,
        formatPhone = (phonenum) => {
            phonenum = String(phonenum);
            if (phonenum.length === US_PHONE_LEN) {
                return "(" + phonenum.substr(0, 3) + ') ' + phonenum.substr(3, 3) + '-' + phonenum.substr(6, 4);
            }
            return phonenum;
        },
        previousWindow = null,
        Location = class Location {

            constructor(data) {
                this.name = data.name;
                this.lat = data.lat;
                this.long = data.long;
                this.URL = "";
                this.street = "";
                this.city = "";
                this.phone = "";
                this.visible = ko.observable(true);

                $.getJSON(this.foursquareURL).done((data) => {
                    let results = data.response.venues[0];
                    if (!results) {
                        return;
                    }
                    if (results.url) {
                        this.URL = results.url;
                    }
                    this.street = results.location.formattedAddress[0];
                    this.city = results.location.formattedAddress[1];
                    this.phone = formatPhone(results.contact.phone || '');

                }).fail((err) => {
                    let currentErr = err.responseJSON.meta;
                    Object.values(currentErr).forEach(errorHandler);


                });

                this.contentString = `
                    <div class="info-window-content"><div class="title"><b>${data.name}</b></div>
                        <div class="content"><a href="${this.URL}">${this.URL}</a></div>
                        <div class="content">${this.street}</div>
                        <div class="content">${this.city}</div>
                        <div class="content">${this.phone}</div>
                    </div>`;

                this.infoWindow = new google.maps.InfoWindow({content: this.contentString});

                this.marker = new google.maps.Marker({
                    position: new google.maps.LatLng(data.lat, data.long),
                    map: map,
                    title: data.name
                });

                this.showMarker = ko.computed(() => {
                    if (this.visible() === true) {
                        this.marker.setMap(map);
                    } else {
                        this.marker.setMap(null);
                    }
                    return true;
                }); // This is bound.

                this.marker.addListener('click', () => {
                    this.contentString = `<div class="info-window-content"><div class="title"><b>${data.name}</b></div>
                        <div class="content"><a href="${this.URL}">${this.URL}</a></div>
                        <div class="content">${this.street}</div>
                        <div class="content">${this.city}</div>
                        <div class="content"><a href="tel:${this.phone}">${this.phone}</a>
                        </div>
                    </div>`;

                    this.infoWindow.setContent(this.contentString);
                    if (previousWindow) {
                        previousWindow.close();
                    }
                    previousWindow = this.infoWindow;
                    this.infoWindow.open(map, this.marker);

                    this.marker.setAnimation(google.maps.Animation.BOUNCE);
                    setTimeout(() => {
                        this.marker.setAnimation(null);
                    }, 2100);
                });

                this.bounce = (place, evt) => {
                    let active = doc.querySelector('#results .is-active');
                    if (active) {
                        active.classList.remove('is-active')
                    }
                    google.maps.event.trigger(this.marker, 'click');
                    evt.currentTarget.classList.add('is-active');
                };
            }

            get foursquareURL() {
                return `https://api.foursquare.com/v2/venues/search?ll=${this.lat},${this.long}&client_id=${CLIENTID}&client_secret=${CLIENTSECRET}&v=20160118&query=${this.name}`;
            }
        },
        AppViewModel = class AppViewModel {

            constructor() {
                this.searchTerm = ko.observable("");

                this.locationList = ko.observableArray([]);

                map = new google.maps.Map(document.getElementById('map'), {
                    zoom: 12,
                    center: {lat: 37.370, lng: -122.002}
                });


                initialLocations.forEach((locationItem) => {
                    this.locationList.push(new Location(locationItem));
                });

                this.filteredList = ko.computed(() => {
                    let filter = this.searchTerm().toLowerCase();
                    if (!filter) {
                        this.locationList().forEach((locationItem) => {
                            locationItem.visible(true);
                        });
                        return this.locationList();
                    } else {
                        return ko.utils.arrayFilter(this.locationList(), (locationItem) => {
                            let string = locationItem.name.toLowerCase();
                            let result = (string.search(filter) >= 0);
                            locationItem.visible(result);
                            return result;
                        });
                    }
                });

                this.mapElem = document.getElementById('map');
                this.mapElem.style.height = window.innerHeight - 50;
            }
        };

    global.initMap = () => {
        ko.applyBindings(new AppViewModel());
    };

    global.errorHandling = (err) => {
        errorHandler(err);
    };
}(this, document, jQuery));