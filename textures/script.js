var units = "dependance(s)";

// Marges et dimensions SVG
var margin = {
        top: 20,
        right: 20,
        bottom: 20,
        left: 20
    },
    width = window.innerWidth - margin.left - margin.right,
    height = window.innerHeight - margin.top - margin.bottom;

// Padding SVG
var svgPadding = {
    top: 10,
    right: 35,
    bottom: 20,
    left: 25
};

var jsonFileName = "flowered_wall_1k.json";
var imageFolderName = "flowered_wall";
var startImage = "flowered_wall_1k.png";


var defaultLinkColor = "steelblue";
var parentLinksOnNodeMouseOverColor = "#005bef";
var childLinksOnNodeMouseOverColor = "#b200ff";

var text = d3.select("body").append("p").style("margin","0")
    .text("Touche N : affichage \"normal\" | Touche R : affichage par rapport à la racine");

// groupe "g" du SVG
var svg = d3.select("body").append("svg")
    .attr("id", "chart")
    .attr("width", width)
    .attr("height", height)
    .append("g")
    .style("display", "inline-block")
    .attr("transform",
        "translate(" + svgPadding.left + "," + svgPadding.top + ")");

// image de visualisation dans le coin supérieur gauche
var imageVisualization = d3.select("svg").append("image")
    .attr("height", 275)
    .attr("y", height - 275)
    .attr("xlink:href", imageFolderName + "/" + startImage);

// création de la tooltip (infobulle)
var tip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

// Initialisation du layout d3.sankey
var sankey = d3.sankey()
    .nodeWidth(100)
    .nodePadding(2)
    .size([width - svgPadding.right - svgPadding.left, height - svgPadding.bottom]);

// Chemins SVG du sankey
var path = sankey.link();

// Données du graphe
var graph = {
    "nodes": [],
    "links": []
};

// Parsing .json
d3.json(jsonFileName).then(function(json) {

    var hierarchy = initValuesFromRoot(formatHierarchy(d3.hierarchy(json)));
    var flatHier = flatHierarchy(hierarchy);
    var nodes = hierarchyToNodes(hierarchy);
    var root = nodes[0];

    computeLinks(hierarchy);
    graph.nodes = nodes;
    normalizeLinkValues(graph.links);

    // Calcul du layout (position des noeuds et liens) en fonction des données passées
    sankey.nodes(graph.nodes)
        .links(graph.links)
        .layout();

    keyboardEventsManager(hierarchy);

    // selection d3 des liens avec les données du sankey bindées
    var link = svg.append("g").selectAll(".link")
        .data(graph.links)
        .enter().append("path")
        .attr("class", "link")
        .attr("d", path)
        .style("stroke-width", function(d) {
            return Math.max(1, d.dy);
        }).style("stroke", function(d) {
            return defaultLinkColor;
        })
        .on("mouseover", function(d) {
            enableTooltip(d.source.id + " → " + d.target.id + "<br/>" +
                "Valeur : " + d.value);
        })
        .on("mouseout", function(d) {
            disableTooltip();
        });

    // selection d3 des noeuds avec les données du sankey bindées
    var node = svg.append("g").selectAll(".node")
        .data(graph.nodes)
        .enter().append("g")
        .attr("class", "node")
        .attr("transform", function(d) {
            return "translate(" + d.x + "," + d.y + ")";
        })
        .attr("width", sankey.nodeWidth())
        .call(d3.drag()
            .clickDistance(5)
            .on("drag", dragmove)
        );

    node.on("mouseover", function(d, i) {
            node.style("opacity", 0.2);
            link.style("opacity", 0.2);
            imageVisualization.attr("xlink:href", imageFolderName + "/" + d.image.slice(0, -4) + "_full.png");
            valoriseParents(root, d);
            valoriseChildren(d, flatHier);
            enableTooltip(d.id);
        })
        .on("mouseout", function(d, i) {
            applyDefaultStyle();
            imageVisualization.attr("xlink:href", imageFolderName + "/" + startImage);
            disableTooltip();
        });

    var nodeRects = node.append("rect")
        .attr("height", function(d) {
            return d.dy;
        })
        .attr("width", sankey.nodeWidth())
        .attr("rx", 2)
        .attr("ry", 2)
        .style("fill", function(d) {
            return "#" + d.color;
        })
        .style("stroke", function(d) {
            return "#" + d.color;
        });

    var nodeImages = node.append("image")
        .attr("height", function(d) {
            return Math.max(1, d.dy);
        })
        .attr("width", sankey.nodeWidth())
        .attr("rx", 2)
        .attr("ry", 2)
        .attr("xlink:href", function(d) {
            return imageFolderName + "/" + d.image;
        });



})

function dragmove(d) {
    d3.select(this)
        .attr("transform",
            "translate(" +
            d.x + "," +
            (d.y = Math.max(-margin.top - svgPadding.top, Math.min(height - d.dy, d3.event.y))) + ")");
    sankey.relayout();
    d3.selectAll(".link").attr("d", path);
}


// PARAM : Racine de l'arborescence .json [rot]
// RETURN : liste des liens extraits en partant de la racine [root]
// valeur par rapport au parent direct
function getLinks(root) {
    var links = [];
    var i = 0;
    var valf = d3.format(".6f");
    getLinksRec(root);

    function getLinksRec(node) {
        if (node.children) {
            node.children.forEach(function(d, i) {
                links.push({
                    "source": node,
                    "target": d,
                    "value": +valf(d.value),
                    "id": node.id + "." + d.id
                });
                getLinksRec(d);
            })
        }
    }
    return links;
}

// PARAM : Racine de l'arborescence .json [rot]
// RETURN : liste des liens extraits en partant de la racine [root]
// valeur par rapport à la racine
function getLinksFromRoot(root) {
    var links = [];
    var i = 0;
    var valf = d3.format(".6f");
    getLinksFromRootRec(root);

    function getLinksFromRootRec(node) {
        if (node.children) {
            node.children.forEach(function(d, i) {
                links.push({
                    "source": node,
                    "target": d,
                    "value": +valf(d.valueFromRoot),
                    "id": node.id + "." + d.id
                });
                getLinksFromRootRec(d);
            })
        }
    }
    return links;
}

// PARAM : liste de noeuds [nodes] et ID de filtrage [id]
// RETURN : liste de noeuds ayant l'ID [id]
function getAllNodesWithID(nodes, id) {
    var nodesWithId = [];
    nodes.forEach(function(d, i) {
        if (d.id === id) {
            nodesWithId.push(d);
        }
    })
    return nodesWithId;
}

// PARAM : liste de noeuds [nodes] et ID filtrage [id]
// RETURN : Retourne le premier noeud avec l'id correspondant [id]
function getNodeById(nodes, id) {
    var node;
    nodes.forEach(function(d, i) {
        if (d.id === id) {
            node = d;
            return;
        }
    })
    return node;
}

// PARAM : racine de l'arborescence json [root] et noeud considéré [node]
// RETURN : liste des liens et noeuds parents en parcourant l'arborescence de la
// racine jusqu'au noeud considéré
function getParents(root, node) {
    var parents = {
        "nodes": [],
        "links": []
    };
    getParentsRec(root);

    function getParentsRec(nodeRec) {
        if (nodeRec.id === node.id) {
            return true;
        } else if (nodeRec.depth > node.depth) {
            return false;
        }
        var found = false;
        if (nodeRec.children) {
            nodeRec.children.forEach(function(d, i) {
                if (getParentsRec(d)) {
                    parents.nodes.push(nodeRec.id);
                    parents.links.push(getd3LinkFromTo(nodeRec, d));
                    found = true;
                }
            })
        }
        return found;
    }
    return parents;
}


// PARAM : noeud considéré [node]
// RETURN : liste des liens et noeuds enfant en parcourant l'arborescence du
// noeud considéré jusqu'à la fin de l'arborescence
function getChildren(node, nodes) {

    var children = {
        "nodes": [],
        "links": []
    };

    var nodewithid = getAllNodesWithID(nodes, node.id);
    nodewithid.forEach(function(d) {
        getChildrenRec(d);
    })

    function getChildrenRec(nodeRec) {
        children.nodes.push(nodeRec.id);
        if (nodeRec.children) {
            nodeRec.children.forEach(function(d, i) {
                children.links.push(getd3LinkFromTo(nodeRec, d))
                getChildrenRec(d);
            })
        }
    }
    return children;
}
// PARAM : deux noeuds [nodeA] et [nodeB]
// RETURN : lien entre les deux noeuds en se basant sur d3
function getd3LinkFromTo(nodeA, nodeB) {
    var link;
    d3.selectAll(".link").data().forEach(function(d, i) {
        if (d.source.id === nodeA.id && d.target.id === nodeB.id) {
            link = d;
        }
    })
    return link;
}




// PARAM : noeud on mouseover [node] et racine de l'arborescence [root]
// RETURN : void, met en valeur les noeuds et liens parents du noeud [node]
function valoriseParents(root, node) {
    var parents = getParents(root, node);
    d3.selectAll(".node").filter(function(d, i) {
        return parents.nodes.includes(d.id) || d === node;
    }).style("opacity", 1);
    d3.selectAll(".link").filter(function(d, i) {
            return parents.links.includes(d);
        }).style("opacity", 1)
        .style("stroke", parentLinksOnNodeMouseOverColor);
}

// PARAM : noeud on mouseover [node]
// RETURN : void, met en valeur les noeuds et liens enfants du noeud [node]
function valoriseChildren(node, nodes) {
    var children = getChildren(node, nodes);
    d3.selectAll(".node").filter(function(d, i) {
        return children.nodes.includes(d.id) || d === node;
    }).style("opacity", 1);
    d3.selectAll(".link").filter(function(d, i) {
            return children.links.includes(d);
        }).style("opacity", 1)
        .style("stroke", childLinksOnNodeMouseOverColor);
}



// BRIEF : applique le style par défaut aux noeuds et liens
function applyDefaultStyle() {
    applyDefaultOpacity();
    applyDefaultLinkColor();
}

// BRIEF : applique l'opacité par défaut aux noeuds et liens
function applyDefaultOpacity() {
    d3.selectAll(".link")
        .style("opacity", "1");
    d3.selectAll(".node")
        .style("opacity", "1");
}

// BRIEF : applique la couleur par défaut des liens
function applyDefaultLinkColor() {
    d3.selectAll(".link")
        .style("stroke", defaultLinkColor);
}

function formatHierarchy(hierarchy) {
    var root = hierarchy.data;
    root.value = hierarchy.value;
    root.depth = hierarchy.depth;
    root.height = hierarchy.height;
    root.parent = hierarchy.parent;

    formatHierarchyRec(hierarchy);

    function formatHierarchyRec(node) {
        if (node.children) {
            node.children.forEach(function(d) {
                d.parent = d.parent.data;
                var root = d.data;
                root.value = d.value;
                root.depth = d.depth;
                root.height = d.height;
                root.parent = d.parent;
                formatHierarchyRec(d);
            });
        }
    }
    hierarchy = extractData(hierarchy);

    return hierarchy;
}

function extractData(hierarchy) {
    return hierarchy.data;
}

function initValuesFromRoot(hierarchy) {

    hierarchy.valueFromRoot = 1;
    initValuesFromRootRec(hierarchy);

    function initValuesFromRootRec(node) {
        if (node.children) {
            node.children.forEach(function(d) {
                d.valueFromRoot = node.valueFromRoot * d.value;
                initValuesFromRootRec(d);
            });
        }
    }

    return hierarchy;
}

function flatHierarchy(hierarchy) {
    var nodes = [];
    flatHierarchyRec(hierarchy);

    function flatHierarchyRec(node) {
        nodes.push(node)
        if (node.children) {
            node.children.forEach(function(d) {
                flatHierarchyRec(d);
            })
        }
    }
    return nodes;
}

function hierarchyToNodes(hierarchy) {
    var nodeFlags = {};
    var flatHier = flatHierarchy(hierarchy);
    flatHier.forEach(function(d) {
        if (!nodeFlags[d.id]) {
            nodeFlags[d.id] = Object.assign({}, d);
        }
    });

    return Object.values(nodeFlags);
}

function mergeLinks(links) {
    var linkFlags = {}
    links.forEach(function(d) {
        if (linkFlags[d.id]) {
            linkFlags[d.id].value += d.value;
        } else {
            linkFlags[d.id] = d;
        }
    });

    return Object.values(linkFlags);
}


// fonction de tests
function getSumByDepth(nodes, links) {
    var depthSums = {};
    links.forEach(function(d) {
        var depth = getNodeById(nodes, d.source).depth;
        if (depthSums[depth]) {
            depthSums[depth] += d.value;
        } else {
            depthSums[depth] = d.value;
        }
    })
    console.log(depthSums);
}

function updateLinks() {
    var links = d3.selectAll(".link");
    links.select("title")
        .text(function(d, i) {
            return d.source.id + " → " + d.target.id + "\n" +
                "Valeur : " + d.value;
        });

    links.transition().attr("d", path)
        .style("stroke-width", function(d) {
            return Math.max(1, d.dy);
        });
}

function updateNodes() {
    var nodes = d3.selectAll(".node");
    nodes.transition().attr("transform", function(d) {
        return "translate(" + d.x + "," + d.y + ")";
    });
    nodes.select("rect").transition().attr("height", function(d) {
        return d.dy;
    });
    nodes.select("image").transition().attr("height", function(d) {
        return Math.max(1, d.dy);
    });
}

function computeLinksFromRoot(hierarchy) {
    graph.links = mergeLinks(getLinksFromRoot(hierarchy));
    graph.links.forEach(function(d, i, arr) {
        arr[i].target = arr[i].target.id;
        arr[i].source = arr[i].source.id;
    });
}

function computeLinks(hierarchy) {
    graph.links = mergeLinks(getLinks(hierarchy));
    graph.links.forEach(function(d, i, arr) {
        arr[i].target = arr[i].target.id;
        arr[i].source = arr[i].source.id;
    });
}


function keyboardEventsManager(hierarchy) {
    document.addEventListener("keydown", function(event) {
        const keyName = event.key;
        if (keyName === "r") { // Affichage des proportions par rap. à la racine

            computeLinksFromRoot(hierarchy);
            imageVisualization.transition().style("opacity", "0");
            sankey
                .nodes(graph.nodes)
                .links(graph.links)
                .layout();

            d3.selectAll(".node").data(graph.nodes);
            d3.selectAll(".link").data(graph.links);

            updateLinks();
            updateNodes();


        }
        if (keyName === "n") { // Affichage classique

            computeLinks(hierarchy);
            normalizeLinkValues(graph.links);
            imageVisualization.transition().style("opacity", "1");
            sankey
                .nodes(graph.nodes)
                .links(graph.links)
                .layout();

            d3.selectAll(".node").data(graph.nodes);
            d3.selectAll(".link").data(graph.links);

            updateLinks();
            updateNodes();

        }

    });
}


function normalizeLinkValues(links) {
    var linkSourcesFlags = {}
    links.forEach(function(d) {
        if (linkSourcesFlags[d.id.split(".", 1)[0]]) {
            linkSourcesFlags[d.id.split(".", 1)[0]] += d.value;
        } else {
            linkSourcesFlags[d.id.split(".", 1)[0]] = d.value;
        }
    });

    links.forEach(function(d, i, arr) {
        var scale = d3.scaleLinear()
            .domain([0, linkSourcesFlags[d.id.split(".", 1)[0]]])
            .range([0, 1]);

        arr[i].value = scale(arr[i].value);
    });
    return links;
}

// PARAM : contenu de la tooltip [content]
// RETURN : void, gère l'apparition et le contenu de tooltip
function enableTooltip(content) {
    tip.transition()
        .delay(500)
        .duration(200)
        .style("opacity", .8);

    tip.html(content)
        .style("left", (d3.event.pageX + 10) + "px")
        .style("top", (d3.event.pageY - 10) + "px");
}

// RETURN : void, gère la disparition de tooltip
function disableTooltip() {
    tip.transition()
        .duration(100)
        .style("opacity", 0);
}







// Anciennes fonctions qui ne sont plus utilisées pour le moment


// PARAM : liste de noeuds [nodes]
// RETURN : Retourne la liste de noeuds fusionnés par ID égal (des noeuds ayant
// le même id sont regoupés en un seul)
function mergeWithSameId(nodes) {
    var nodeChildrens = {};
    var nodeParents = {};
    var mergedNodes = [];
    nodes.forEach(function(d, i) {
        if (nodeChildrens[d.id]) {
            nodeChildrens[d.id] = nodeChildrens[d.id].concat(getAllChildren(d));
            removeDuplicateChildren(nodeChildrens[d.id]);

        } else {
            nodeChildrens[d.id] = getAllChildren(d);
            mergedNodes.push(Object.assign({}, d)); // copie
        }

        if (nodeParents[d.id]) {
            nodeParents[d.id] = nodeParents[d.id].concat(d.parent);
            removeDuplicateParents(nodeParents[d.id]);

        } else {
            nodeParents[d.id] = [d.parent];
        }
    })
    mergedNodes.forEach(function(d, i) {
        d.children = nodeChildrens[d.id];
        d.parent = nodeParents[d.id];

    });
    return mergedNodes;
}





// PARAM : liste de noeuds enfants [children]
// RETURN : [!] liste en paramètre modifiée [!] doublons supprimés
function removeDuplicateChildren(children) {
    var childFlag = {};
    for (var i = 0; i < children.length; i++) {

        if (childFlag[children[i].id]) {
            children.splice(children.indexOf(children[i]), 1);
            i--;
        } else {
            childFlag[children[i].id] = true;
        }
    }
}

// PARAM : liste de noeuds parents [parents]
// RETURN : [!] liste en paramètre modifiée [!] doublons supprimés
function removeDuplicateParents(parents) {
    var parentFlag = {};
    for (var i = 0; i < parents.length; i++) {

        if (parentFlag[parents[i].id]) {
            parents.splice(parents.indexOf(parents[i]), 1);
            i--;
        } else {
            parentFlag[parents[i].id] = true;
        }
    }
}

// PARAM : objet noeud [node]
// RETURN : liste des enfants du noeud si la liste existe et renvoie une liste
// vide sinon
// NOTE: Simplifiable nodeChildren.push en nodeChildren = node.children ?
function getAllChildren(node) {
    var nodeChildren = [];
    if (node.children) {
        node.children.forEach(function(d, i) {
            nodeChildren.push(d);
        })
    }
    return nodeChildren;
}


// PARAM : tableau de liens à formater [links]
// RETURN : tableau de liens formatés.Formate les liens avec des IDs plutot que les objects
function formatLinksWithIDs(links) {
    var linkIDs = links.map(function(d, i) {
        d.source = d.source.id;
        d.target = d.target.id;
        return d;
    });
    return linkIDs;
}





// PARAM : liste de liens [links] et racine de l'arborescence [root]
// RETURN : void, modifie les valeurs des liens pour dépendre de
// la valeur du lien parent
function computeDescendingLinkValues(links, root) {
    var previousValue = 1;
    computeDescendingLinkValuesRec(root, previousValue);

    function computeDescendingLinkValuesRec(node, previousValue) {
        if (node.children) {
            node.children.forEach(function(d, i) {
                var link = getLinkFromTo(links, node, d);
                var initialValue = previousValue;
                link.value *= previousValue;
                previousValue = link.value;
                computeDescendingLinkValuesRec(d, previousValue);
                previousValue = initialValue;
            })
        }
    }
}

function computeDescendingLinkValues2(links, root) {
    var previousValue = 1;
    computeDescendingLinkValues2Rec(root, previousValue);

    function computeDescendingLinkValues2Rec(node, previousValue) {
        if (node.children) {
            node.children.forEach(function(d, i) {
                var link = getLinkFromTo(links, node, d);
                var initialValue = previousValue;
                link.value *= previousValue;
                previousValue = link.value;
                computeDescendingLinkValues2Rec(d, previousValue);
                previousValue = initialValue;
            })
        }
    }
}


// PARAM : liste de liens [links]
// RETURN : liste de liens ou les doublons sont fusionnés et fusion des valeur
// de liens
function removeDuplicateLinksWithID(links) {
    var linkFlags = {};
    for (var i = 0; i < links.length; i++) {
        if (linkFlags[links[i].source + "" + links[i].target]) {
            linkFlags[links[i].source + "" + links[i].target].value += links[i].value;
        } else {
            linkFlags[links[i].source + "" + links[i].target] = links[i];
        }
    }
    return Object.values(linkFlags);
}




// PARAM : deux noeuds [nodeA] et [nodeB] et liste des liens (objets)
// RETURN : lien entre les deux noeuds en se basant sur les objets
function getLinkFromTo(links, nodeA, nodeB) {
    var link;
    links.forEach(function(d, i) {
        if (d.source === nodeA.id && d.target === nodeB.id) {
            link = d;
        }
    })
    return link;
}
