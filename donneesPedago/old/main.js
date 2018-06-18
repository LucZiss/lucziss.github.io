var margin = {top: 10, right: 30, bottom: 30, left: 30};
var width = window.innerWidth - margin.left - margin.right;
var height = window.innerHeight - margin.top - margin.bottom;

//setup svg
var svg = d3.select(".chart").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  	.append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

//setup sankey
var sankey = d3.sankey()
    .nodeWidth(36)
    .nodePadding(40)
    .size([width, height]);

// var path = sankey.links();
// console.log(path);

// sankey.nodeId(function id(d) {
// 	return d.ueid;
// });

var graph;

//load JSON file
d3.json("pedago.json").then(function(data) {

	// var root = d3.hierarchy(data);
	// console.log(root);
	// console.log(data);
	// console.log(getLinks(data));

	graph = { "nodes" : data, "links" : getLinks(data) };

	displaySankey();
})


function displaySankey()
{
	var computedSankey = sankey(graph);

	console.log(computedSankey.nodes);
	console.log(computedSankey.links);

	//affichage des noeuds
	var node = svg.append("g").selectAll(".node")
		.data(graph.nodes)
		.enter().append("g")
		.attr("class", "node")
		.attr("transform", function(d) { 
			return "translate(" + d.x + "," + d.y + ")"; 
		});

	//affichage des liens
	var link = svg.append("g").selectAll(".link")
		.data(graph.links)
		.enter().append("path")
		.attr("class", "link")
		.attr("d", sankey.link()) //pb NaN cf console
		.sort(function(a, b) { return b.dy - a.dy; });
}


// PARAM : un tableau de noeuds représentants les UEs et une compétence pour
// filtrer les UEs
// RETURN : renvoie un tableau comportant les UEs en lien avec la compétence
function getCourseBySkill(arrayCourse, skill) {
    return arrayCourse.filter(function(d, i) {

        var skillArray = d.dependances,
            bool = false;

        skillArray.forEach(function(d, i) {
            if (d[0] === skill) {
                bool = true;
            }
        })

        return bool;
    })
}

// PARAM : un tableau de noeuds représentants les UEs
// RETURN : renvoie un tableau de liens de dépendances entre UEs
function getLinks(arrayCourse) {
    var links = [];

    arrayCourse.forEach(function(d, i) {
        d.dependances.forEach(function(din) {
            for (var j = 1; j < din.length; j++) {
                links.push({
                    "source": getCourseById(arrayCourse,+d.ueid),
                    "linktype": din[0],
                    "target": getCourseById(arrayCourse,+din[j]),
                });
            }
        })
    })

    return links;
}


function getCourseById(courseArray,courseId)
{
    var course = courseArray.filter(function(d) {
        return +d.ueid === courseId;
    })

    if(course.length && course[0])
        return course[0];
}