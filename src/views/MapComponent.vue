<template>
    <div class="map-container">
      <div id="map" class="map"></div>
    </div>
  </template>
  
  <script>
  /* global google */
  export default {
    name: 'MapComponent',
    props: {
      address: {
        type: String,
        required: true
      }
    },
    data() {
      return {
        map: null,
        geocoder: null
      };
    },
    async mounted() {
      // Carga la biblioteca de Google Maps
      await this.loadGoogleMapsScript();
  
      // Inicializa el mapa y geocoder
      this.initMap();
    },
    methods: {
      loadGoogleMapsScript() {
        return new Promise((resolve) => {
          if (typeof google !== 'undefined') {
            resolve();
            return;
          }
  
          const script = document.createElement('script');
          script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyD2-8A4YQjn3bJrv8dCetyeFQ0WQTLYbJQ&libraries=places`;
          script.async = true;
          script.defer = true;
          script.onload = resolve;
          document.head.appendChild(script);
        });
      },
      initMap() {
        this.geocoder = new google.maps.Geocoder();
        this.map = new google.maps.Map(document.getElementById('map'), {
          zoom: 15,
          center: { lat: 0, lng: 0 },
        });
  
        this.geocodeAddress(this.address);
      },
      geocodeAddress(address) {
        this.geocoder.geocode({ address }, (results, status) => {
          if (status === 'OK') {
            this.map.setCenter(results[0].geometry.location);
            new google.maps.Marker({
              map: this.map,
              position: results[0].geometry.location,
            });
          } else {
            console.error('Error de geocodificación:', status);
          }
        });
      }
    }
  };
  </script>
  
  <style scoped>
  .map-container {
    width: 100%;
    height: 300px;
    margin-top: 20px;
  }
  .map {
    width: 100%;
    height: 100%;
    border-radius: 8px;
  }
  </style>
  