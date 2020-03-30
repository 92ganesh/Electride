 	  var map;
   	  var markerType=0;
   	  var sourceSelected=null; 
   	  var destinationSelected= [];

      function init() {
      	 map = L.map('map');
      	 
         L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors',
            maxZoom: 18
         }).addTo(map);
         map.attributionControl.setPrefix(''); // Don't show the 'Powered by Leaflet' text.

         var centerPoint = new L.LatLng(19.1311044, 72.8679281); // geographical point (longitude and latitude)
         map.setView(centerPoint, 17);

		 map.on('click', onMapClick);
      }
      
      function setMarkerColorBlue(){markerType=1;}
      function setMarkerColorRed(){markerType=2;}
      
      function onMapClick(e) {
    	  if(markerType==1 && sourceSelected==null){
    		  sourceSelected = {"lat":e.latlng.lat, "lng":e.latlng.lng};
        	  var circle = L.circle([e.latlng.lat, e.latlng.lng], {
          	    color: 'blue',
          	    fillColor: 'blue',
          	    fillOpacity: 0.5,
          	    radius: 10
          		}).addTo(map);
          }else if(markerType==2){
        	  destinationSelected.push({"lat":e.latlng.lat, "lng":e.latlng.lng});
        	  var circle = L.circle([e.latlng.lat, e.latlng.lng], {
           	    color: 'red',
           	    fillColor: '#f03',
           	    fillOpacity: 0.5,
           	    radius: 10
           		}).addTo(map);
          }
      }
    
    	function highlightPath(pathNodes){
    		var polylinePoints=[]; var index=0;
    		for (i = 0; i < pathNodes.length; i++,index++) {
    			polylinePoints[index] = new L.LatLng(pathNodes[i].lat, pathNodes[i].lng);
    		} 
    		
            var polylineOptions = {
                  color: 'blue',
                  weight: 6,
                  opacity: 0.9
                };

            var polyline = new L.Polyline(polylinePoints, polylineOptions);
            map.addLayer(polyline); 
    	}
    	
    	function findShortestPath(){
    		document.getElementById("getPath").style.display = "none";
    		readMap();
    	}