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
var imageMasksFolderName = "flowered_wall_maps/invert/invertselectedcontourswhite";
var clickedImageMasksFolderName = "flowered_wall_maps/invert/invertselectedcontourswhite";
var startImage = "flowered_wall_1k.png";


var defaultLinkColor = "steelblue";
var parentLinksOnNodeMouseOverColor = "#b200ff";
var childLinksOnNodeMouseOverColor = "#b200ff";

// groupe "g" du SVG
var svg = d3.select("body").append("svg")
    .attr("id", "chart")
    .attr("width", width)
    .attr("height", height)
    .append("g")
    .style("display", "inline-block")
    .attr("transform",
        "translate(" + svgPadding.left + "," + svgPadding.top + ")");

// image de visualisation dans le coin inferieur gauche

var selectColorFilter;
var overColorFilter;


var imageGroup = d3.select("svg").append("g")
    .attr("id", "imageGroup");

var imageVisualizationBg = imageGroup.append("image")
    .attr("id", "bg-img")
    .attr("height", 275)
    .attr("width", 500)
    .attr("preserveAspectRatio","xMinYMax meet")
    .attr("y", height - 275)
    .attr("xlink:href", imageMasksFolderName + "/" + startImage);

var imageVisualization = imageGroup.append("image")
    .attr("id", "over-img")
    .attr("height", 275)
    .attr("width", 500)
    .attr("preserveAspectRatio","xMinYMax meet")    .attr("y", height - 275);

var selectedNode;
var selectedNodeColor = "#ffff00";
var overNodeColor = "#000000";


// Si les filtres sont supportés par le navigateur
var filtersAreOn = ("filter" in document.getElementById("over-img").style);
if (filtersAreOn) {
    imageMasksFolderName = "flowered_wall_maps/invert/invertselectedcontourswhite";
    clickedImageMasksFolderName = "flowered_wall_maps/invert/invertselectedcontourswhite";
    setMasksColorFilters();
    updateMaskColor("selectColorFilter", selectedNodeColor);
    updateMaskColor("overColorFilter", overNodeColor);
}
createColorPickers(filtersAreOn);
colorPickersHandler(filtersAreOn);






var nodeInfoBox = d3.select("svg").append("g");
var nodeInfoRec = nodeInfoBox.append("rect")
    .attr("height", 50)
    .attr("width", 300)
    .attr("y", height - 275 - 60)
    .attr("x", 0)
    .style("opacity", "0.8")
    .style("fill", "#333333");
var nodeInfoText = nodeInfoBox.append("text")
    .attr("id", "node-info-text")
    .attr("height", 50)
    .attr("width", 300)
    .attr("y", height - 275 - 30)
    .attr("x", 20)
    .style("fill", "white");

// var currentMasksDisplayed = [];


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

    var hierarchy = formatHierarchy(d3.hierarchy(json));
    hierarchy = initTreeValuesFromRoot(hierarchy);
    hierarchy = addImageMasksToHierarchy(hierarchy);

    var flatHier = flatHierarchy(hierarchy);
    var nodes = hierarchyToNodes(hierarchy);
    var root = nodes[0];

    graph.nodes = nodes;
    computeLinks(hierarchy, root);

    // Calcul du layout (position des noeuds et liens) en fonction des données passées
    sankey.nodes(graph.nodes)
        .links(graph.links)
        .layout();

    // selection d3 des liens avec les données du sankey bindées
    var link = svg.append("g").attr("id", "linkgroup")
        .selectAll(".link")
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
                "Valeur : " + (Math.round(d.value * 10000) / 100) + "%");
        })
        .on("mouseout", function(d) {
            disableTooltip();
        });

    hideLinks(link);

    // selection d3 des noeuds avec les données du sankey bindées
    var node = svg.append("g").selectAll(".node")
        .data(graph.nodes)
        .enter().append("g")
        .attr("class", "node")
        .attr("transform", function(d) {
            return "translate(" + d.x + "," + d.y + ")";
        })
        .attr("width", sankey.nodeWidth());
    // .call(d3.drag()
    //     .clickDistance(5)
    //     .on("drag", dragmove)
    // );

    node.on("mouseover", function(d, i) {

            imageVisualization.attr("xlink:href", imageMasksFolderName + "/" + d.imagemask.slice(0, -4) + ".png")
                .style("opacity", "0.8");

            if (selectedNode) {

                node.style("opacity", 0.2);
                link.style("opacity", 0.2);

                if (selectedNode.depth > d.depth) {
                    valoriseChildren(d, flatHier, true);
                } else if (selectedNode.depth < d.depth) {
                    valoriseParents(root, d, true);

                } else {
                    valoriseParents(root, d, false);
                    valoriseChildren(d, flatHier, false);
                }
            }

            if(d3.select(this).datum() != selectedNode){
                d3.select(this).select("rect")
                    .style("stroke", overNodeColor)
                    .style("stroke-width", "5px");
            }
        })
        .on("mouseout", function(d, i) {
            applyDefaultStyle();
            imageVisualization.attr("xlink:href", "");

            if(d3.select(this).datum() != selectedNode){
                d3.select(this).select("rect")
                    .style("stroke", function(d) {
                        return "#" + d.color;
                    })
                    .style("stroke-width", "2px");
            }
        })
        .on("click", function(d) {
            hideLinks(link);
            computeLinks(hierarchy, d);
            updateLinks();

            // style noeuds non sélectionnés
            node.classed("selectedNode", false)
                .selectAll("rect")
                .style("stroke", function(d) {
                    return "#" + d.color;
                })
                .style("stroke-width", "2px");

            if(selectedNode && selectedNode.id == d.id) {
                selectedNode = null;
                hideLinks(link);
                d3.select("#imageGroup").select("#selected-img").remove();
                d3.select("#node-info-text").text("");
            }
            else {
                selectedNode = d;
                d3.selectAll(".link").classed("ondisplaylink", false);
                displayParentLinks(root, d);
                displayChildrenLinks(d, flatHier);

                link.style("opacity","0.2");
                node.style("opacity","0.2");
                valoriseParents(root, d, false);
                valoriseChildren(d, flatHier, false);

                var imageGroup = d3.select("#imageGroup");
                imageGroup.select("#selected-img").remove();
                if (d.depth != 0) {
                    imageGroup.append("image")
                        .attr("id", "selected-img")
                        .attr("height", 275)
                        .attr("width", 500)
                        .attr("preserveAspectRatio","xMinYMax meet")
                        .style("opacity", "1")
                        .attr("y", height - 275)
                        .attr("xlink:href", clickedImageMasksFolderName + "/" + d.imagemask.slice(0, -4) + ".png");
                    if (filtersAreOn) {
                        d3.select("#selected-img").style("filter", "url(#selectColorFilter)")
                    }

                // style noeuds sélectionnés
                node.filter(function(di, i) {
                        return di === d;
                    })
                    .classed("selectedNode", true)
                    .selectAll("rect")
                    .style("stroke", selectedNodeColor)
                    .style("stroke-width", "8px");
                }

                d3.select("#node-info-text").text("");
                d3.select("#node-info-text")
                    .append("tspan")
                    .attr("x", 0)
                    .attr("dy", -10)
                    .text(("Pixels : " + (sumSize(getAllNodesWithID(flatHier, d.id)))));
                d3.select("#node-info-text")
                    .append("tspan")
                    .attr("x", 0)
                    .attr("dy", 20)
                    .text("Proportion de l'image : " + (Math.round((sumSize(getAllNodesWithID(flatHier, d.id))/sumSize(getAllNodesWithID(flatHier, root.id)))*10000)/100) + "%");
            }

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



// ============================= INTERACTION CLICK =============================

// PARAM : racine de l'arborescence json [root] et noeud considéré [node]
// RETURN : void, affiche les liens parents
function displayParentLinks(root, node) {
    var parents = setParentsOnDisplay(root, node);
    d3.selectAll(".link").filter(function(d, i) {
            return parents.links.includes(d);
        }).style("display", "block")
        .style("stroke", parentLinksOnNodeMouseOverColor);
}

// PARAM : racine de l'arborescence json [root] et noeud considéré [node]
// RETURN : liste de liens parents à afficher
function setParentsOnDisplay(root, node) {
    var parents = {
        "links": []
    };
    var links = d3.selectAll(".link");
    setParentsOnDisplayRec(root);

    function setParentsOnDisplayRec(nodeRec) {
        if (nodeRec.id === node.id) {
            return true;
        } else if (nodeRec.depth > node.depth) {
            return false;
        }
        var found = false;
        if (nodeRec.children) {
            nodeRec.children.forEach(function(d, i) {
                if (setParentsOnDisplayRec(d)) {
                    var d3link = getd3LinkFromTo(nodeRec, d);
                    d3link.classed("ondisplaylink", true);
                    parents.links.push(d3link.datum());
                    found = true;
                }
            })
        }
        return found;
    }
    return parents;
}

// PARAM : noeud considéré [node] et liste de noeuds [nodes]
// RETURN : void, affiche les liens et enfants
function displayChildrenLinks(node, nodes) {
    var children = setChildrenOnDisplay(node, nodes);
    d3.selectAll(".link").filter(function(d, i) {
            return children.links.includes(d);
        }).style("display", "block")
        .style("stroke", parentLinksOnNodeMouseOverColor);
}

// PARAM : noeud considéré [node] et liste de noeuds [nodes]
// RETURN : liste de liens enfants à afficher
function setChildrenOnDisplay(node, nodes) {
    var children = {
        "links": []
    };

    var nodewithid = getAllNodesWithID(nodes, node.id);
    nodewithid.forEach(function(d) {
        setChildrenOnDisplayRec(d);
    })

    function setChildrenOnDisplayRec(nodeRec) {
        if (nodeRec.children) {
            nodeRec.children.forEach(function(d, i) {
                var d3link = getd3LinkFromTo(nodeRec, d);

                d3link.classed("ondisplaylink", true);
                children.links.push(d3link.datum());
                setChildrenOnDisplayRec(d);
            })
        }
    }
    return children;
}

// =============================================================================



// =========================== INTERACTION MOUSEOVER ===========================

// PARAM : noeud on mouseover [node] et racine de l'arborescence [root]
// RETURN : void, met en valeur les noeuds et liens parents du noeud [node]
function valoriseParents(root, node, nodeSelected) {
    var parents = getDisplayedParents(root, node);
    var selectedNodeCondition = true;

    d3.selectAll(".node").filter(function(d, i) {

        if (nodeSelected) {
            if (selectedNode.depth > d.depth) {
                selectedNodeCondition = false;
            } else {
                selectedNodeCondition = true;
            }
        }

        return (parents.nodes.includes(d.id) && selectedNodeCondition) || d === node;
    }).style("opacity", 1);

    d3.selectAll(".link").filter(function(d, i) {

            if (nodeSelected) {
                if (selectedNode.depth > d.source.depth) {
                    selectedNodeCondition = false;
                } else {
                    selectedNodeCondition = true;
                }
            }

            return parents.links.includes(d) && selectedNodeCondition;
        }).style("opacity", 1)
        .style("stroke", parentLinksOnNodeMouseOverColor);
}

// PARAM : racine de l'arborescence json [root] et noeud considéré [node]
// RETURN : liste des liens et noeuds parents à afficher en parcourant l'arborescence de la
// racine jusqu'au noeud considéré
function getDisplayedParents(root, node) {
    var parents = {
        "nodes": [],
        "links": []
    };
    var links = d3.selectAll(".link");
    getDisplayedParentsRec(root);

    function getDisplayedParentsRec(nodeRec) {
        if (nodeRec.id === node.id) {
            return true;
        } else if (nodeRec.depth > node.depth) {
            return false;
        }
        var found = false;
        if (nodeRec.children) {
            nodeRec.children.forEach(function(d, i) {
                if (getDisplayedParentsRec(d)) {
                    var d3link = getd3LinkFromTo(nodeRec, d);

                    if (d3link.classed("ondisplaylink")) {
                        parents.nodes.push(nodeRec.id);
                        parents.links.push(d3link.datum());
                        found = true;
                    }

                }
            })
        }
        return found;
    }
    return parents;
}

// PARAM : noeud considéré [node] et liste de noeuds [nodes]
// RETURN : void, met en valeur les noeuds et liens enfants du noeud [node]
function valoriseChildren(node, nodes, nodeSelected) {
    var children = getDisplayedChildren(node, nodes);
    var selectedNodeCondition = true;

    d3.selectAll(".node").filter(function(d, i) {

        if (nodeSelected) {
            if (selectedNode.depth < d.depth) {
                selectedNodeCondition = false;
            } else {
                selectedNodeCondition = true;
            }
        }
        return (children.nodes.includes(d.id) && selectedNodeCondition) || d === node;
    }).style("opacity", 1);

    d3.selectAll(".link").filter(function(d, i) {
            if (nodeSelected) {
                if (selectedNode.depth < d.target.depth) {
                    selectedNodeCondition = false;
                } else {
                    selectedNodeCondition = true;
                }
            }
            return children.links.includes(d) && selectedNodeCondition;
        }).style("opacity", 1)
        .style("stroke", childLinksOnNodeMouseOverColor);
}

// PARAM : noeud considéré [node] et liste de noeuds [nodes]
// RETURN : liste des liens et noeuds parents à afficher en parcourant l'arborescence du
// noeud considéré jusqu'à la fin de l'arborescence
function getDisplayedChildren(node, nodes) {

    var children = {
        "nodes": [],
        "links": []
    };

    var nodewithid = getAllNodesWithID(nodes, node.id);
    nodewithid.forEach(function(d) {
        getDisplayedChildrenRec(d);
    })

    function getDisplayedChildrenRec(nodeRec) {
        children.nodes.push(nodeRec.id);
        if (nodeRec.children) {
            nodeRec.children.forEach(function(d, i) {
                var d3link = getd3LinkFromTo(nodeRec, d);

                if (d3link.classed("ondisplaylink")) {
                    children.links.push(d3link.datum());
                    getDisplayedChildrenRec(d);
                }
            });
        }
    }
    return children;
}

// =============================================================================

// =========================== FONCTIONS UTILITAIRES ===========================


function colorPickersHandler(filterOn) {

    if (filterOn) {
        document.getElementById("selected-color-picker").addEventListener("change", function() {
            updateMaskColor("selectColorFilter", this.value);
            selectedNodeColor = this.value;
            d3.selectAll(".selectedNode").select("rect")
                .style("stroke", selectedNodeColor)
                .style("stroke-width", "8px");
        });

        document.getElementById("over-color-picker").addEventListener("change", function() {
            updateMaskColor("overColorFilter", this.value);
            overNodeColor = this.value;
        });
    }
    document.getElementById("link-color-picker").addEventListener("change", function() {
        parentLinksOnNodeMouseOverColor = this.value;
        childLinksOnNodeMouseOverColor = this.value;
    });
}

function createColorPickers(filterOn) {

    var colorPickersDiv = document.getElementById("colorPickersDiv");
    var d3colorPickersDiv = d3.select("#colorPickersDiv");

    if (filterOn) {

        colorPickersDiv.innerHTML += "Filtre région sélectionnée : ";
        d3colorPickersDiv.append("input")
            .attr("type", "color")
            .attr("id", "selected-color-picker")
            .attr("value", selectedNodeColor);

        colorPickersDiv.innerHTML += " Filtre région survol : ";
        d3colorPickersDiv.append("input")
            .attr("type", "color")
            .attr("id", "over-color-picker")
            .attr("value", overNodeColor);
    }

    colorPickersDiv.innerHTML += " Couleur des liens (survol): ";
    d3colorPickersDiv.append("input")
        .attr("type", "color")
        .attr("id", "link-color-picker")
        .attr("value", childLinksOnNodeMouseOverColor);

}

function setMasksColorFilters() {

    selectColorFilter = svg.append("filter")
        .attr("id", "selectColorFilter")
        .append("feColorMatrix")
        .attr("in", "SourceGraphic")
        .attr("type", "matrix")
        .attr("values", "1 0 0 0 0 " +
            "0 1 0 0 0 " +
            "0 0 1 0 0 " +
            "0 0 0 1 0");


    overColorFilter = svg.append("filter")
        .attr("id", "overColorFilter")
        .append("feColorMatrix")
        .attr("in", "SourceGraphic")
        .attr("type", "matrix")
        .attr("values", "1 0 0 0 0 " +
            "0 1 0 0 0 " +
            "0 0 1 0 0 " +
            "0 0 0 1 0");

    d3.select("#over-img").style("filter", "url(#overColorFilter)")

}

function updateMaskColor(maskid, hexValue) {
    var splitedHexValue = hexValue.split("");
    var red = splitedHexValue[1] + splitedHexValue[2];
    var green = splitedHexValue[3] + splitedHexValue[4];
    var blue = splitedHexValue[5] + splitedHexValue[6];
    var rgbValue = [red, green, blue].map(function(v) {
        return parseInt(v, 16)
    });
    changeColorFilter(maskid, rgbValue, 1);

}


function changeColorFilter(maskid, rgbColorTab, opacity) {
    var red = rgbColorTab[0] / 255;
    var green = rgbColorTab[1] / 255;
    var blue = rgbColorTab[2] / 255;
    d3.select("#" + maskid).select("feColorMatrix")
        .attr("values", "" + red + " 0 0 0 0 " +
            "0 " + green + " 0 0 0 " +
            "0 0 " + blue + " 0 0 " +
            "0 0 0 " + opacity + " 0");
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


// PARAM : deux noeuds [nodeA] et [nodeB]
// RETURN : lien entre les deux noeuds en se basant sur d3
function getd3LinkFromTo(nodeA, nodeB) {
    return d3.selectAll(".link").filter(function(d, i) {
        return d.source.id === nodeA.id && d.target.id === nodeB.id;
    });
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

// PARAM : hierarchie en arbre [hierarchy]
// RETURN : la hierarchie avec des informations supplémentaires
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
    hierarchy = hierarchy.data;

    return hierarchy;
}

// inutilisée ACTUELLEMENT
// PARAM : hierarchie en arbre [hierarchy] et ID filtrage [id]
// RETURN : Retourne le noeud avec l'id correspondant [id]
function getNodeInHierarchy(hierarchy, id) {
    var ref;
    getNodeInHierarchyRec(hierarchy, id);

    function getNodeInHierarchyRec(hierarchy, id) {
        if (hierarchy.id === id) {
            ref = hierarchy;
        }

        if (hierarchy.children) {
            hierarchy.children.forEach(function(d) {
                getNodeInHierarchyRec(d, id);
            });
        }

    }

    return ref;
}


// PARAM : hierarchie en arbre [hierarchy]
// RETURN : Retourne le tableau des noeuds extraits de la hierarchie
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


// PARAM : hierarchie en arbre [hierarchy]
// RETURN : Retourne le tableau des noeuds extraits de la hierarchie sans motif
// doublon
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


// BRIEF : met à jour les valeurs de liens
function updateLinks() {
    sankey.links(graph.links).layout();
    var links = d3.selectAll(".link");
    links.data(graph.links);

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

// inutilisée ACTUELLEMENT
// BRIEF : met à jour les noeuds
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


// PARAM : hierarchie en arbre [hierarchy], noeud de reference  [reference]
// (objet avec id,etc)
// RETURN : void, calcule les liens du diagramme sans doublon source-destination
// et remplace les noeuds par leurs IDs
function computeLinks(hierarchy, reference) {
    graph.links = mergeLinks(getLinks(hierarchy, reference));
    graph.links.forEach(function(d, i, arr) {
        arr[i].target = arr[i].target.id;
        arr[i].source = arr[i].source.id;
    });
}


// PARAM : liste de liens [links]
// (objet avec id,etc)
// RETURN : liste de liens sans doublons
function mergeLinks(links) {
    var linkFlags = {}
    links.forEach(function(d) {
        if (!linkFlags[d.id]) {
            linkFlags[d.id] = d;
        }
    });
    return Object.values(linkFlags);
}

// PARAM : Racine de l'arborescence .json [rot], noeud de reference [reference]
// RETURN : liste des liens extraits en partant de la racine [root]
// valeur par rapport à une référence
function getLinks(root, reference) {
    var links = [];
    var i = 0;
    var valf = d3.format(".6f");
    getLinksRec(root);

    function getLinksRec(node) {
        if (node.children) {
            if (node.depth >= reference.depth) {
                node.children.forEach(function(d, i) {
                    links.push({
                        "source": node,
                        "target": d,
                        "value": +valf(getDescendantProportion(root, node, d, reference)),
                        "id": node.id + "." + d.id
                    });

                    getLinksRec(d);
                })
            } else {
                node.children.forEach(function(d, i) {
                    links.push({
                        "source": node,
                        "target": d,
                        "value": +valf(getAscendantProportion(root, node, d, reference)),
                        "id": node.id + "." + d.id
                    });

                    getLinksRec(d);
                })
            }
        }
    }
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


// PARAM : hierarchie en arbre [hierarchy]
// RETURN : hierarchie avec ajout des masques pour la visualisation de carte
function addImageMasksToHierarchy(hierarchy) {
    hierarchy.imagemask = startImage;

    addImageMasksToHierarchyRec(hierarchy);

    function addImageMasksToHierarchyRec(node) {
        if (node.children) {
            node.children.forEach(function(d) {
                d.imagemask = startImage.slice(0, -4) + "_" + d.depth + "_" + d.id + "_pattern.png";
                addImageMasksToHierarchyRec(d);
            })
        }
    }

    return hierarchy;
}


// PARAM : liste de noeuds ancetres [ancestors], noeud [b]
// RETURN : bool, true si tous les [ancestors] sont ancetres de noeud [b], false sinon
function areTreeAncestorOf(ancestors, b) {
    var bool = true;
    var bAncestors = getTreeAncestorsOf(b);
    ancestors.forEach(function(d) {
        if (!bAncestors.includes(d.id)) {
            bool = false;
        }
    });

    return bool;
}


// PARAM : noeud de l'arborescence [nodeTree]
// RETURN : liste des ancetres de l'arborescence de [nodeTree]
function getTreeAncestorsOf(nodeTree) {
    var ancestors = [];
    getTreeAncestorsOfRec(nodeTree);

    function getTreeAncestorsOfRec(node) {
        if (node.parent !== null) {
            if (!ancestors.includes(node.parent.id)) {
                ancestors.push(node.parent.id);
            }
            getTreeAncestorsOfRec(node.parent);
        }
    }
    return ancestors;
}

// PARAM : liste de noeuds ancetres [ancestors(FACULTATIF)], noeud [a], racine arborescence [root]
// RETURN : float proportion absolue du noeud d'arborescence [a] (par rapport à la racine)
// en sachant que [a] doit avoir [ancestors] pour ancetres si définit
function computeProportionFromTreeRoot(root, a, ancestors) {
    var nodeValueFromRoot = 0;
    var aNodes = getAllNodesWithID(flatHierarchy(root), a.id);
    aNodes.forEach(function(d) {
        if (ancestors) {
            if (areTreeAncestorOf(ancestors, d)) {
                nodeValueFromRoot += d.valueFromRoot;
            }
        } else {
            nodeValueFromRoot += d.valueFromRoot;
        }
    });
    //
    // computeProportionFromTreeRootRec(root, a);
    //
    // function computeProportionFromTreeRootRec(node, al) {
    //
    //     currentValue *= node.value;
    //     if (node.id === al.id) {
    //         if (ancestors) {
    //             if (areTreeAncestorOf(ancestors, node)) {
    //                 nodeValueFromRoot += currentValue;
    //             }
    //         } else {
    //             nodeValueFromRoot += currentValue;
    //         }
    //     }
    //
    //     if (node.children) {
    //         node.children.forEach(function(d) {
    //             computeProportionFromTreeRootRec(d, al);
    //             currentValue /= d.value;
    //         });
    //     }
    // }

    return nodeValueFromRoot;
}

// PARAM : liste de noeuds ancetres [ancestors(FACULTATIF)], noeud [a] et [b], racine arborescence [root]
// RETURN : float proportion du noeud graphe [b] dans [a]
// en sachant que [b] doit avoir [ancestors] pour ancetres si définit
function computeProportionFromNodeIn(root, a, b, ancestors) {
    var nancestors = ancestors;
    if (nancestors) {
        nancestors.push(a);
    } else {
        nancestors = [a];
    }
    var sizeofA = computeProportionFromTreeRoot(root, a);
    var sizeofB = computeProportionFromTreeRoot(root, b, nancestors);
    return sizeofB / sizeofA;
}

function initTreeValuesFromRoot(root) {
    root.valueFromRoot = 1;
    initTreeValuesFromRootRec(root);

    function initTreeValuesFromRootRec(node) {
        if (node.children) {
            node.children.forEach(function(d) {
                d.valueFromRoot = node.valueFromRoot * d.value;
                initTreeValuesFromRootRec(d);
            });
        }
    }
    return root;
}

// PARAM : selection d3 de liens
// RETURN : void, fait disparaitre tous les liens en parametre
function hideLinks(links) {
    links.style("display", "none");
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

// fonction renvoyant un tableau de noeuds de l'arbre correspondant a l'intersection entre les noeuds de graphe A et B,
// le noeud B etant un descendant du noeud A
function getIntersectBetween2(nodeA, nodeB, root) {
    var res = [];
    getAllNodesWithID(flatHierarchy(root), nodeA.id).forEach(function(node) {
        getIntersectBetween2Rec(node, nodeB);
    })

    return res;

    function getIntersectBetween2Rec(nodeA, nodeB) {
        nodeA.children.forEach(function(n) {
            if (n.id === nodeB.id) {
                res.push(n);
            }

            if (!n.children)
                return;
            else
                getIntersectBetween2Rec(n, nodeB);
        })
    }
}

// fonction renvoyant un tableau de noeuds de l'arbre correspondant a l'intersection entre les noeuds de graphe A et B et Ref,
// le noeud Ref etant un descendant du noeud B etant lui-meme un descendant du noeud A
function getIntersectBetween3(nodeA, nodeB, nodeC, root) {
    var intersection = [];

    var maxDepthNodes = getAllNodesWithID(flatHierarchy(root), nodeC.id);

    maxDepthNodes.forEach(function(d) {
        if (areTreeAncestorOf([nodeA, nodeB], d)) {
            intersection.push(d);
        }
    });

    return intersection;

}

// renvoie la somme des tailles de chaque noeud d'un tableau de noeud
function sumSize(nodeTab) {
    var res = 0;

    nodeTab.forEach(function(n) {
        res += n.npixels;
    })

    return res;
}

function getAscendantProportion(root, nodeA, nodeB, nodeRef) {
    var refSize = sumSize(getAllNodesWithID(flatHierarchy(root), nodeRef.id));

    if (nodeB.id == nodeRef.id) {
        return (sumSize(getIntersectBetween2(nodeA, nodeB, root)) / refSize);
    } else {
        return (sumSize(getIntersectBetween3(nodeA, nodeB, nodeRef, root)) / refSize);
    }
}

function getDescendantProportion(root, nodeA, nodeB, nodeRef) {
    var refSize = sumSize(getAllNodesWithID(flatHierarchy(root), nodeRef.id));

    if (nodeA.id == nodeRef.id) {
        return (sumSize(getIntersectBetween2(nodeA, nodeB, root)) / refSize);
    } else {
        return (sumSize(getIntersectBetween3(nodeRef, nodeA, nodeB, root)) / refSize);
    }
}

// =============================================================================


// ===================== AUTRES PAS UTILISEES ACTUELLEMENT =====================
function addSelectedNode(d) {
    var exist = currentSelection.indexOf(d);
    if (exist >= 0) {
        removeFromSelection(d);
    } else {
        currentSelection.push(d);
    }
}

function removeFromSelection(d) {
    d3.select("#img_" + currentSelection[currentSelection.indexOf(d)].id).remove();
    currentSelection.splice(currentSelection.indexOf(d), 1);
    currentMasksDisplayed.splice(currentMasksDisplayed.indexOf(d.id), 1);
}

function displaySelectedMasks() {
    var imageGroup = d3.select("#imageGroup");

    currentSelection.forEach(function(elem) {
        if (!currentMasksDisplayed.includes(elem.id)) {
            imageGroup.append("image")
                .attr("id", "img_" + elem.id)
                .attr("height", 275)
                .attr("y", height - 275)
                .attr("xlink:href", imageMasksFolderName + "/" + elem.imagemask.slice(0, -4) + ".png");

            currentMasksDisplayed.push(elem.id);
        }
    });
}

function dragmove(d) {
    d3.select(this)
        .attr("transform",
            "translate(" +
            d.x + "," +
            (d.y = Math.max(-margin.top - svgPadding.top, Math.min(height - d.dy, d3.event.y))) + ")");
    d3.selectAll(".link").attr("d", path);
}
