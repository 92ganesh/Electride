function readMap(){
    xmlhttp = new XMLHttpRequest();
	xmlhttp.onreadystatechange = function() {
		if (this.readyState == 4 && this.status == 200) {
            jsonFile = JSON.parse(this.responseText);
            createGraph(jsonFile.elements);
		}
	};
	xmlhttp.open("GET", "https://api.openstreetmap.org/api/0.6/map?bbox=72.86617,19.13006,72.87116,19.13286", true);
	xmlhttp.setRequestHeader("Accept", "application/json");
	xmlhttp.send();
}

function calcDist(node1, node2, nodes){
	return calcGeoDist(nodes.get(node1), nodes.get(node2));
}

function calcGeoDist(pt1, pt2){
	return Math.sqrt( ( (pt1.lat-pt2.lat)*(pt1.lat-pt2.lat) ) + ( (pt1.lng-pt2.lng)*(pt1.lng-pt2.lng) ));
}

function createGraph(elements){
    let graph = new Map();
    let nodes = new Map();
    let nodesOnWay = new Map();

    for(var i=0; i<elements.length; i++){
        if(elements[i].type=="node"){
            nodes.set(elements[i].id,{"lat":elements[i].lat, "lng":elements[i].lon});
            graph.set(elements[i].id, new Map());
        }else if(elements[i].type=="way" && elements[i].tags.highway!=null){
            for(var j=0;j<elements[i].nodes.length-1;j++){
            	nodesOnWay.set(elements[i].nodes[j],null);
                graph.get(elements[i].nodes[j]).set(elements[i].nodes[j+1], calcDist(elements[i].nodes[j], elements[i].nodes[j+1], nodes) );
                graph.get(elements[i].nodes[j+1]).set(elements[i].nodes[j], calcDist(elements[i].nodes[j], elements[i].nodes[j+1], nodes) );
            }
            nodesOnWay.set(elements[i].nodes[elements[i].nodes.length-1],null);
        }
    }
    
    var minDist=Infinity; var sourceId = -1;
    for(let node of nodesOnWay.keys()){
    	var temp = calcGeoDist(sourceSelected, nodes.get(node));
    	if(temp<minDist){
    		minDist = temp;  
    		sourceId = node;
    	}
    }
    
    var circle = L.circle([nodes.get(sourceId).lat, nodes.get(sourceId).lng], {
  	    color: 'blue',
  	    fillColor: 'yellow',
  	    fillOpacity: 0.5,
  	    radius: 10
  		}).addTo(map);
  		
  	
  	var approxDestinations = [];
  	for(var i=0; i<destinationSelected.length;i++){
  		var minDist=Infinity; var destinationId = -1;
	    for(let node of nodesOnWay.keys()){
	    	var temp = calcGeoDist(destinationSelected[i], nodes.get(node));
	    	if(temp<minDist){
	    		minDist = temp;  
	    		destinationId = node;
	    	}
	    }
		
		approxDestinations.push(destinationId);
	    var circle = L.circle([nodes.get(destinationId).lat, nodes.get(destinationId).lng], {
	  	    color: 'red',
	  	    fillColor: 'yellow',
	  	    fillOpacity: 0.5,
	  	    radius: 10
	  		}).addTo(map);
  	}
    
    
 
 	var algorithm = document.getElementById("algo").value;
 	if(algorithm=="dijkstra"){
 		 console.log("using Dijkstra");
 		 dijkstra(nodes, graph, sourceId, approxDestinations);
 	}else if(algorithm=="floydWarshall"){
 		 console.log("using floydWarshall");
 		 floydWarshall(nodes, graph, sourceId, approxDestinations);
 	}else if(algorithm=="bellmanFord"){
 		 console.log("using bellmanFord");
 		 bellmanFord(nodes, graph, sourceId, approxDestinations);
 	}
}

function bellmanFord(nodes, graph, source, approxDestinations){
	let distance = new Map();
	let parent = new Map();
	for(let node of graph.keys()){
		distance.set(node,Infinity);
	}
	distance.set(source,0);
	
	for(var i=0; i<graph.size-1; i++){
		var relaxed = true;
		for(let u of graph.keys()){
    		for(let v of graph.keys()){
    			var wt = graph.get(u).get(v);
    			if(distance.get(u)+wt < distance.get(v)){
    				relaxed = false;
    				distance.set(v, distance.get(u)+wt);
    				parent.set(v,u);
    			}
    		}
    	}
    	
    	if(relaxed){ 
    		break;
    	}
	}
	
	// find path
	for(var i=0; i<approxDestinations.length; i++){
		var path = [];
		curr = approxDestinations[i];
		while(curr!=null){
			path.push(nodes.get(curr));
			curr = parent.get(curr);
		}
		
		highlightPath(path);
	}
	
}


function floydWarshall(nodes, graph, source, approxDestinations){
	let disMatrix = new Map();
	let next = new Map();
	for (let node of graph.keys()) {
		disMatrix.set(node, new Map().set(node,0));
		next.set(node, new Map().set(node,node));
		for(let neighbour of graph.get(node).keys()){
			disMatrix.get(node).set(neighbour, graph.get(node).get(neighbour));
			next.get(node).set(neighbour, neighbour);
		}
	}
	
	for(let k of disMatrix.keys()){
		for(let i of disMatrix.keys()){
    		for(let j of disMatrix.keys()){
    			if(disMatrix.get(i).has(k) && disMatrix.get(k).has(j)){
    				if(!disMatrix.get(i).has(j) ){
    					disMatrix.get(i).set(j, Infinity);
    				}
    				
    				if( (disMatrix.get(i).get(k) + disMatrix.get(k).get(j) ) < disMatrix.get(i).get(j)){
    				 	disMatrix.get(i).set(j, (disMatrix.get(i).get(k) + disMatrix.get(k).get(j)));
    				 	next.get(i).set(j, next.get(i).get(k));
    				}
    			}
    		}
		}
	}
	
	
	// find path
	for(var i=0; i<approxDestinations.length; i++){
		var path = [];
		if(next.has(source) && next.get(source).has(approxDestinations[i])){
			var u = source;   var v = approxDestinations[i];
			path.push(nodes.get(u));
			while(u!=v){
				u = next.get(u).get(v);
				path.push(nodes.get(u));
			}
		}
		
		highlightPath(path);
	}
	
}


function dijkstra(nodes, graph, source, approxDestinations){
	let nodeInfo = new Map();
	for (let node of nodes.keys()) {
		nodeInfo.set(node,{minDist:Infinity, parent:null, visited:false});
	}
	
	nodeInfo.get(source).minDist=0;
	var queue = new Map();
	queue.set(source,null);
	
	while(queue.size>0){
		var minDist = Infinity;  var minNode = -1;
		for(let ele of queue.keys()){
			if(nodeInfo.get(ele).minDist<minDist){
				minDist = nodeInfo.get(ele).minDist;  minNode=ele;
			}
		}
		
		queue.delete(minNode);
		nodeInfo.get(minNode).visited = true;
		
		for(let neighbour of graph.get(minNode).keys()){
			if(nodeInfo.get(neighbour).visited==false){
				queue.set(neighbour,null);
				if( (nodeInfo.get(minNode).minDist + graph.get(minNode).get(neighbour)) < 
						nodeInfo.get(neighbour).minDist ){
					nodeInfo.get(neighbour).minDist = nodeInfo.get(minNode).minDist + graph.get(minNode).get(neighbour);
					nodeInfo.get(neighbour).parent = minNode;
				}
			}
		}
	}
	
	
	for(var i=0; i<approxDestinations.length; i++){
		var path = [];
		curr = approxDestinations[i];
		while(curr!=null){
			path.push(nodes.get(curr));
			curr = nodeInfo.get(curr).parent
		}
		
		highlightPath(path);
	}
}