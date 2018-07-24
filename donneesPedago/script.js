// NOTE:  Il est possible de remplacer SkillList simplement par sa longueur
// dans certains appels de fonctions
// NOTE : Il est probablement possible de refactorer le code de certaines
// fonctions en créant une fonction de parcours des source/targetLinks


// Marges et taille du SVG
var margin = {
        top: 20,
        right: 300,
        bottom: 50,
        left: 20
    },
    width = window.innerWidth - margin.left - margin.right,
    height = window.innerHeight - margin.top - margin.bottom;





// Padding du SVG
var svgPadding = {
    top: 55,
    right: 35,
    bottom: 60,
    left: 15
};

escapeEvents();

// Création de la selection clic droit et du
// filtre de compétences (Appliquer,Programmation,etc...)
// exemple : currentFilters = ["Appliquer","Réaliser"] affiche
// les UE concernées par les compétences Appliquer et Realiser

// NOTE: currentFilters est sous la forme d'un tableau pour la simple est bonne
// raison que l'on pouvait choisir plusieurs compétences en même temps dans une
// ancienne version du code. Nous avons alors préféré garder cette forme en cas
// de modifications futures.

// currentSelection comporte les noeuds sélectionnés au clic droit (0 à 2 noeuds)
var currentFilters = [];
var currentSelection = [];
var currentSelectedOptions = [];

// dernier noeud option cliqué
var lastClickedOptionNode;

// Echelle d3 de couleurs
var color = d3.scaleOrdinal(d3.schemeCategory10);

// Palette de couleurs UFR-INFO
var rougeClair = "rgb(252, 54, 107)";
var rouge = "rgb(192, 16, 63)";
var rougeBordeaux = "rgb(116, 2, 51)";
var orange = "rgb(255, 130, 77)";
var jaunePale = "rgb(245, 255, 87)";
// var jaune = "rgb(255, 255, 0)";


// Objets ou l'on va récuperer les descriptions de compétences plus loin dans le
// code
var skillDescriptions = {};




// =========================== Gestion des couleurs ===========================
var skillColors = {};


// Couleurs attribuées à chaque bloc
var groupColors = {};

var defaultBackgroundColor = "#eeeeee"; // "#cce6ff"

var defaultSkillDisplayColor = "#cccccc"; // "#b3ccff"
var nodeTextColor = "#000000";

var optionNodeColor = "white";
var optionNodeMouseOverColor = d3.rgb(optionNodeColor).darker(1);
var optionBorderColor = "black";

var defaultBackgroundDropdownColor = "#eeeeee";
var dropdownMouseOverColor = "#aaaaaa";
var dropdownItemBorderColor = "#cccccc";

// =============================================================================





//creation du svg
d3.select("body")
    .style("background-color", defaultBackgroundColor)
    .append("svg")
    .attr("id", "chart")
    .attr("width", width)
    .attr("height", height);


// Test responsive
height = Math.max(height, parseInt(d3.select("#chart").style("min-height")));
width = Math.max(width, parseInt(d3.select("#chart").style("min-width")));
//
d3.select("body").style("min-width", width + margin.right + "px");




//creation du g pour la zone d'option
d3.select("#chart")
    .append("g")
    .attr("id", "optionZone");

// sélection d3 du g dans le svg
var svg = d3.select("#chart")
    .append("g")
    .style("display", "inline-block")
    .attr("transform",
        "translate(" + svgPadding.left + "," + svgPadding.top + ")");




initInfoWindow();

// Division à droite du svg représentant les compétences,blocs,boutons d'interaction
var filterDiv = d3.select("body").append("div")
    .attr("id", "filterDiv")
    .style("width", margin.right - 20 + "px");

// Création du layout d3 sankey
// Il va calculer la position de chaque noeud du graphe
// nodeWidth : largeur du noeud, nodePadding : espacement entre noeud,
// size : taille du sankey
var sankey = d3.sankey()
    .nodePadding(4)
    .size([width - svgPadding.right, height - svgPadding.bottom]);

// Paths svg pour les liens entre noeuds
var path = sankey.link();

// SVG représentant l'axe des semestres sous le graphe (Semestre 1,Semestre 2,etc...)
var semesterLayout = d3.select("body").append("svg")
    .attr("id", "semesterLayout")
    .attr("width", "100%")
    .attr("height", 45)
    .style("background-color", defaultBackgroundColor)
    .append("g");

// création de la tooltip (infobulle)
var tip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);


// Gestion du zoom sur la zone du SVG (zoom Max x3)
// zoomHandler(svg, semesterLayout, 3);

var graph;

//gestion du clic en arrière plan
var backgroundClick = true;
d3.select("html").on("click", function() {
    if (backgroundClick) {
        d3.select("#dropdown").remove();
    }
    backgroundClick = true;
});


if (!sessionStorage.getItem("json"))
    sessionStorage.setItem("json", "pedagoLicenceInfo17.json")

update(sessionStorage.getItem("json"));


// -------------------------------- FONCTIONS -------------------------------- //

// PARAM : données .json [data], sélections d3 de noeuds-UE [nodes] et de noeuds
// option [options]
// RETURN : void, initialise les mécaniques  et l'apparence des boutons de
// suppression d'option préalablement choisie
function initOptionDeleteButton(data, nodes, options) {

    var nodeCircles = nodes.filter(function(d) {
            return d.option === "true";
        }).append("circle")
        .attr("class", "clickable")
        .attr("cx", function(d) {
            return sankey.nodeWidth() + 7;
        })
        .attr("cy", function(d) {
            return 7;
        }).attr("r", 7)
        .style("display", "none");

    nodeCircles.on("click", function(d, i) {

        hideCircleAndMoveToInitPos(d);
        showUEAndDuplicates(data, +d.ueid);
        sankey.relayout();
        d3.selectAll(".link").attr("d", path);
        removeOptionFromSelection(options, d);
    })

    var nodeCircleTexts = nodes.filter(function(d) {
            return d.option === "true";
        }).append("text")
        .classed("opt-text", true)
        .style("display", "none")
        .attr("x", function(d) {
            return sankey.nodeWidth() + 2;
        })
        .attr("y", function(d) {
            return 11;
        })
        .style("fill", "white")
        .text("x");
}

// PARAM : noeud [node] concerné par l'action de réinitilisation de position
// après déselection
// RETURN : void, renvoie le noeud à sa position initiale après déselection et
// cache la croix de déselection.
function hideCircleAndMoveToInitPos(node) {
    var node = d3.selectAll(".node").filter(function(dnode) {
        return node === dnode;
    }).attr("transform",
        "translate(" +
        (node.x = node.initialX) + "," +
        (node.y = node.initialY) + ")");
    node.select("circle").style("display", "none");
    node.select("text").style("display", "none");
}

// PARAM : données .json [data], id du noeud à afficher [id]
// RETURN : void, affiche le noeud d'id [id] ainsi que ses doublons
function showUEAndDuplicates(data, id) {
    var showUEAndDuplicates = getDuplicatesOfUE(data, +id);
    var nodesToShow = d3.selectAll(".node").filter(function(dnodes) {
        return showUEAndDuplicates.includes(+dnodes.ueid);
    });

    nodesToShow.style("display", "block");

    nodesToShow.each(function(d) {
        var linksToShow = d3.selectAll(".link").filter(function(link) {
            return d.sourceLinks.includes(link) ||
                d.targetLinks.includes(link);
        });
        linksToShow.classed("dupsLinksToHide", false);
        displayLinks(linksToShow);
    });
}

// PARAM : noeuds options [options] et noeud [node] à retirer de la sélection
// d'option
// RETURN : void, retire le noeud de la sélection et réaffiche le slot d'option
function removeOptionFromSelection(options, node) {
    options.each(function(dopt) {
        if (dopt.selectedUE === node) {
            var idx = currentSelectedOptions.indexOf(+node.ueid);
            currentSelectedOptions.splice(idx, 1);
            d3.select(this).style("display", "block");
        }
    });
}


// PARAM : tableau d'UE [UEArray], noeud option cliqué [optionNode], données
// .json [data]
// RETURN : void, initialise les mécaniques de dropdown ainsi que son contenu
function initDropdown(UEArray, optionNode, data) {

    if (dropdownManager(optionNode)) return;
    lastClickedOptionNode = optionNode;

    var dropdown = d3.select("body").append("div")
        .attr("id", "dropdown")
        .style("opacity", "0.8")
        .style("background-color", defaultBackgroundDropdownColor)
        .style("position", "absolute")
        .style("top", optionNode.y + margin.top + "px")
        .style("left", optionNode.x + margin.left + sankey.nodeWidth() + "px")
        .style("width", sankey.nodeWidth() + "px");

    for (var i = 0; i < filterUESelection(data, optionNode.ueList).length; i++) {

        dropdown.append("div")
            .datum(getUEById(UEArray, filterUESelection(data, optionNode.ueList)[i]))
            .attr("class", "clickable items")
            .style("border-top", "1px solid " + dropdownItemBorderColor)
            .style("border-bottom", "1px solid " + dropdownItemBorderColor)
            .on("click", function(doption) {

                var choosenUE = d3.selectAll(".node").filter(function(dnode) {
                    return doption === dnode;
                });

                optionNode.selectedUE = (choosenUE.data()[0]) ? choosenUE.data()[0] : {};
                addOptionToSelection(data, UEArray, choosenUE);

                choosenUE.attr("transform",
                        "translate(" +
                        (doption.x = optionNode.x) + "," +
                        (doption.y = optionNode.y) + ")")
                    .select("rect").style("fill", defaultBackgroundColor);

                choosenUE.select("circle").style("display", "block");
                choosenUE.select("text").style("display", "block");

                sankey.relayout();
                d3.selectAll(".link").attr("d", path);

                d3.selectAll(".option").filter(function(doption) {
                    return doption === optionNode;
                }).style("display", "none");

                d3.select("#dropdown").remove();
            })
            .append("p")
            .style("opacity", "1")
            .style("font-size", "10px")
            .style("text-align", "center")
            .text(getUEById(UEArray, filterUESelection(data, optionNode.ueList)[i]).abreviation);
    }

    // items de dropdown onmouseover
    d3.selectAll(".items").on("mouseover", function() {
        var overedItem = d3.select(this);
        overedItem.style("background-color", dropdownMouseOverColor); //dropdown mouseover color
        d3.selectAll(".node").filter(function(node) {
            return overedItem.datum().ueid == node.ueid;
        }).select("rect").style("fill", dropdownMouseOverColor);

    }).on("mouseout", function() {
        var overedItem = d3.select(this);
        overedItem.style("background-color", defaultBackgroundDropdownColor);
        d3.selectAll(".node").filter(function(node) {
            return overedItem.datum().ueid == node.ueid;
        }).select("rect").style("fill", defaultBackgroundDropdownColor);
    });
}


// PARAM : données .json [data], tableau d'UE [UEArray] et UE-option choisie
// [UEChoice]
// RETURN : void, ajoute l'option choisie à la sélection (currentSelectedOptions)
// et fait disparaitre les doublons (comme Droit S4 doublon de Droit S6) ainsi
// que leurs liens
function addOptionToSelection(data, UEArray, UEChoice) {

    currentSelectedOptions.push(+UEChoice.data()[0].ueid);

    var duplicatesToHide = hideDuplicatesOfUE(data, +UEChoice.data()[0].ueid);
    var linksFromDuplicatesToHide = d3.selectAll(".link").filter(function(link) {
        var boolean = false;
        duplicatesToHide.forEach(function(node) {
            if (getUEById(UEArray, node).sourceLinks.includes(link) ||
                getUEById(UEArray, node).targetLinks.includes(link)) {
                boolean = true;
            }
        });
        return boolean;
    })
    linksFromDuplicatesToHide.classed("dupsLinksToHide", true);
    hideLinks(linksFromDuplicatesToHide);

    d3.selectAll(".node").filter(function(d) {
        return duplicatesToHide.includes(+d.ueid);
    }).style("display", "none");
}

// PARAM : noeud option [nodeopt] où le dropdown doit apparaitre/disparaitre
// RETURN : true si c'est la même option qui est recliqué, false sinon. Fait
// disparaitre le dropdown quand il le faut
function dropdownManager(nodeopt) {
    if (!d3.select("#dropdown").empty() && lastClickedOptionNode === nodeopt) {
        d3.select("#dropdown").remove();
        return true;
    } else if (!d3.select("#dropdown").empty()) {
        d3.select("#dropdown").remove();
    }
    return false;
}

// RETURN : renvoie une chaine de caractere representant la taille de police
// adaptee de sorte que le label tienne dans la largeur du noeud
function adaptLabelFontSize() {

    var xPadding, labelAvailableWidth, labelWidth;
    xPadding = 8;
    labelAvailableWidth = sankey.nodeWidth() - xPadding;
    labelWidth = this.getComputedTextLength();

    if (labelWidth < labelAvailableWidth) {
        return null;
    }

    return (labelAvailableWidth / labelWidth) + "em";
}

// PARAM : un tableau de noeuds représentants les UEs [UEArray]
// et une compétence pour filtrer les UEs [skill]
// RETURN : renvoie un tableau comportant les UEs en lien avec la compétence
function getUEBySkill(UEArray, skill) {
    return UEArray.filter(function(d, i) {

        var skillArray = d.dependances,
            bool = false;

        skillArray.forEach(function(d, i) {
            if (d[0] === skill) {
                bool = true;
            }
        });

        return bool;
    });
}

// PARAM : un tableau de noeuds représentants les UEs [UEArray]
// RETURN : renvoie un tableau de liens de dépendances entre UEs
function getLinks(UEArray) {
    var links = [];

    UEArray.forEach(function(d, i) {
        d.dependances.forEach(function(din) {
            for (var j = 1; j < din.length; j++) {
                links.push({
                    "source": +d.ueid,
                    "linktype": din[0],
                    "target": +din[j],
                    "value": 1
                });
            }
        });
    });

    return links;
}

// PARAM : un tableau de noeuds représentants les UEs [UEArray]
// et un entier représentant un id d'UE [UEId]
// RETURN : renvoie l'UE correspondant à l'id [UEId]
function getUEById(UEArray, UEId) {
    var UEs = UEArray.filter(function(d) {
        return +d.ueid === +UEId;
    });

    if (UEs.length && UEs[0]) {
        return UEs[0];
    }
}

// PARAM : tableau d'UEs [UEArray]
// RETURN : tableau [min,max] des valeurs de semestre (ex pour la licence : [1,6])
function getMinMaxSemester(UEArray) {
    return d3.extent(UEArray, function(d) {
        return +d.semestre;
    });
}

// PARAM : element considéré pour le zoom [tagToTransform1][tagToTransform2],
// multiplicateur max du zoom [maxZoom] et argument à indiquer
// si l'on souhaite réinitialiser l'échelle
function zoomHandler(tagToTransform1, tagToTransform2, maxZoom, reset) {

    d3.select("#chart")
        .call(d3.zoom()
            .scaleExtent([1 / 2, maxZoom])
            .translateExtent([
                [-width, -height],
                [2 * width + margin.right, 2 * height + margin.bottom]
            ])
            .on("zoom", zoomingDoc)
        );

    var transform = d3.zoomTransform(d3.select("#chart").node());
    transform.x = svgPadding.left;
    transform.y = svgPadding.top;

    if (reset) {
        transform.k = 1;
        tagToTransform2.attr("transform", "scale(1)");
    }

    function zoomingDoc() {
        d3.select("#dropdown").remove();
        tagToTransform1.attr("transform", d3.event.transform);
        tagToTransform2.attr("transform", "translate(" + (d3.event.transform.x - svgPadding.left) + ", 0) scale(" + d3.event.transform.k + ")");
    }
}

// PARAM : selection d3 de liens [links] entre UEs
// RETURN : void, affiche les liens avec une couleur différente selon la
// compétence mise en jeu
function displayLinks(links) {

    if (getDisplayMode() !== "skillDisplay") {
        return;
    }
    links.filter(function(d, i) {
        return d3.select(this).classed("ondisplaylinks") &&
            !d3.select(this).classed("dupsLinksToHide");
    }).style("stroke", function(d) {
        return skillColors[d.linktype];
    });
}

// PARAM : selection d3 de liens [links] entre UEs
// RETURN : void, fait disparaitre les liens [links] à l'affichage
function hideLinks(links) {

    links.style("stroke", "none");
}

// PARAM : selection d3 de noeuds-UEs [nodes] à afficher
// RETURN : void, affiche les noeuds [nodes] avec une opacité par défaut
function displayNodes(nodes) {
    nodes.filter(function(d, i) {
        return d3.select(this).classed("ondisplaynodes");
    }).style("opacity", "1");
}

// PARAM : selection d3 de noeuds-UEs [nodes] à cacher
// RETURN : void, réduit l'opacité des noeuds [nodes] à l'affichage
function hideNodes(nodes) {

    nodes.style("opacity", "0.2");
}

// PARAM : filtres courants [skill]
// RETURN : tableau de filtres appliqués, gere l'affichage en fonction du filtrage
function filterSkill(skill) {

    var links = d3.selectAll(".link");
    var nodes = d3.selectAll(".node");
    var displayedLinks = links.filter(function(d) {
        var containsFilter = skill.includes(d.linktype);
        if (containsFilter) {
            d3.select(this).classed("ondisplaylinks", true);
        } else {
            d3.select(this).classed("ondisplaylinks", false);
        }
        return containsFilter;
    });
    hideLinks(links);
    displayLinks(displayedLinks);

    var displayedNodes = nodes.filter(function(d) {
        var containsFilter = false;
        d.dependances.forEach(function(ddep, idep) {
            if (ddep[0] && skill.includes(ddep[0]))
                containsFilter = true;
        });
        if (containsFilter) {
            d3.select(this).classed("ondisplaynodes", true);
        } else {
            d3.select(this).classed("ondisplaynodes", false);
        }
        return containsFilter;
    });

    hideNodes(nodes);
    displayNodes(displayedNodes);
    applyColours(getDisplayMode());

    if (!currentFilters.length) {
        applyDefaultOpacity(links, nodes);
    }

    if (currentSelection.length == 1) {
        links.style("opacity", "0.2");
        nodes.style("opacity", "0.2");
        valoriseAdjacentLinks(currentSelection[0]).style("opacity", "1");
        valoriseAdjacentNodes(currentSelection[0], currentFilters)
            .style("opacity", "1");
    }

    return skill;
}

// PARAM : noeud [node] servant à mettre en valeur
// RETURN : selection d3 comportant tous les liens dont le noeud [node] est la
// source ou la destination
function valoriseAdjacentLinks(node) {
    var links = d3.selectAll(".link");

    return links.filter(function(d) {
        var containsFilter = false;
        var containsFilter2 = false;
        node.targetLinks.forEach(
            function(din) {
                if (d.target === din.target) {
                    containsFilter = true;
                }
            }
        );

        node.sourceLinks.forEach(
            function(din) {
                if (d.source === din.source) {
                    containsFilter2 = true;
                }
            }
        );
        return containsFilter || containsFilter2;
    });
}

// PARAM : noeud [node] servant à mettre en valeur
// RETURN : void, gere l'affichage en fonction du filtrage
function valoriseAdjacentNodes(node, currentFilters) {
    var links = d3.selectAll(".link");
    var nodes = d3.selectAll(".node");


    return nodes.filter(function(dn) {
        var containsFilter = false;

        links.each(function(d) {
            if (((dn === d.source && d.target === node) ||
                    (dn === d.target && d.source === node) ||
                    (node === dn)) &&
                currentFilters.includes(d.linktype)) {
                containsFilter = true;
            }
        });

        return containsFilter;
    });

}

// PARAM : selection d3 des liens [links], des noeuds [nodes]
// RETURN : void, remet l'opacité des liens et des noeuds par défaut
function applyDefaultOpacity(nodes, links) {
    if (nodes)
        nodes.style("opacity", "1");
    if (links)
        links.style("opacity", "1");
}

// PARAM : selection d3 du lien courant qui est onmouseover [link]
// RETURN : selection d3 des noeuds qui sont de part et d'autre du lien [link]
function valoriseNodesOnLinkHover(link) {
    var nodes = d3.selectAll(".node");


    return nodes.filter(function(d) {
        return (link.datum().source === d || link.datum().target === d);
    });
}

// PARAM : mode d'affichage actuel [mode] (string)
//RETURN : Applique une couleur de fond aux noeuds
function applyColours(mode) {
    // return d.color = defaultSkillDisplayColor;
    d3.selectAll(".node").each(function(d, i) {
        var ondisplay = d3.select(this).classed("ondisplaynodes");
        d3.select(this).select("rect").attr("fill", function() {
            if (mode == "groupDisplay") {
                return "#eeeeee";
            } else if (mode == "skillDisplay") {
                return "#eeeeee";
            }
        });
    });

    applyBorderColours(mode);
}

function applyBorderColours(mode) {
    d3.selectAll(".node").each(function(d, i) {
        var ondisplay = d3.select(this).classed("ondisplaynodes");
        d3.select(this).select("rect").attr("stroke", function() {
            if (mode == "groupDisplay") {
                return groupColors[d.categorie];
            } else if (mode == "skillDisplay") {
                return d.color = (ondisplay) ?
                    skillColors[currentFilters[0]] :
                    defaultSkillDisplayColor;
            }
        });
    });
}

// PARAM : tableau d'UEs [UEArray]
// Met en place l'affichage des semestres sous le graphe
function displaySemesters(UEArray) {
    var tab = getMinMaxSemester(UEArray);

    var semesterScale = d3.scaleLinear()
        .domain(getMinMaxSemester(UEArray))
        .range([svgPadding.left + (sankey.nodeWidth() / 2), width - (sankey.nodeWidth() / 2) - (svgPadding.right / 2)]);

    for (var i = tab[0]; i <= tab[1]; i++) {
        d3.select("#semesterLayout g").append("text")
            .style("text-anchor", "middle")
            .attr("y", 15)
            .attr("x", semesterScale(i))
            .text("Semestre " + i);
    }
}

// PARAM : tableau d'objets compétences [competences]
// RETURN : tableau des noms de compétences dans le tableau [competences]
// EX : ["Appliquer","Programmer"]
function getSkillList(competences) {
    var SkillList = [];
    competences.forEach(function(comp) {
        SkillList.push(comp.name);
    })
    return SkillList;
}

// PARAM : tableau comportant toutes les compétences [SkillList], graphe [graph], donnees du fichier .json [data]
// RETURN : void, gère les filtres en fonction des checkbox générées par
// cette fonction ainsi que les boutons d'interaction
// Doit être appelée une seule fois
function filterDisplayManager(data, SkillList, graph) {

    setupCursusDisplay(data.cursus);

    radioDisplaySetup();

    var skillDiv = filterDiv.append("div");
    skillDiv.append("h2")
        .text("Compétences");
    displaySkills(SkillList, skillDiv);

    var displayLegendDiv = filterDiv.append("div");
    displayLegendDiv.append("h2")
        .text("Blocs");
    displayBlocks(displayLegendDiv);

    // selectAllSetup(SkillList);

    buttonsSetup(data, graph);

    changeMode(graph, skillDiv, displayLegendDiv);
}

function setupCursusDisplay(cursus) {
    if (cursus == [])
        return;

    if (cursus) {
        var cursusDiv = filterDiv.append("div");
        cursusDiv.append("h2")
            .text("Cursus similaires");

        cursusDiv.selectAll("div").data(cursus).enter()
            .append("input")
            .classed("clickable cursusInput", true)
            .attr("id", function(d, i) {
                return "cursusDisplay" + i;
            })
            .attr("type", "button")
            .attr("name", function(d) {
                return d.name;
            })
            .attr("path", function(d) {
                return d.path;
            })
            .attr("value", function(d) {
                return d.name;
            });
    }

    d3.selectAll(".cursusInput")
        .on("click", function(d) {
            sessionStorage.setItem("json", d3.select(this).attr("path"))
            location.reload();
        })
}

// RETURN : void, initialise l'affichage des boutons radios permettant
// de choisir le mode d'affichage
function radioDisplaySetup() {
    // titre
    filterDiv.append("h2").text("Affichage");

    // choix mode bloc
    filterDiv.append("div")
        .attr("id", "displayRadio")
        .attr("width", "100%")
        .append("input")
        .classed("clickable radioInput", true)
        .attr("id", "groupDisplay")
        .attr("type", "radio")
        .attr("name", "displayMode")
        .attr("value", "groupDisplay")
        .attr("checked", "true")
    filterDiv.select("#displayRadio").append("label")
        .classed("clickable displRadiosText", true)
        .attr("for", "groupDisplay")
        .style("margin-right", "10px")
        .html("Blocs");



    //  choix mode bloc compétence
    filterDiv.select("#displayRadio")
        .append("input")
        .classed("clickable radioInput", true)
        .attr("id", "skillDisplay")
        .attr("type", "radio")
        .attr("name", "displayMode")
        .attr("value", "skillDisplay")
    filterDiv.select("#displayRadio").append("label")
        .classed("clickable displRadiosText", true)
        .attr("for", "skillDisplay")
        .html("Compétences");



}

// PARAM : tableau comportant toutes les compétences [SkillList],
// selection d3 de l'element "div" du DOM contenant les radios
// de l'affichage par competences [skillDiv]
// RETURN : void, gere l'affichage en mode "competences" ainsi que
// la disposition des checkbox/radios de ce mode d'affichage
function displaySkills(SkillList, skillDiv) {

    initDefaultRadio(skillDiv);

    for (var total = 0; total < SkillList.length; total++) {
        var checkDiv = skillDiv.append("div")
            .attr("id", "checkdiv" + total)
            .attr("class", "radio-area");
        checkDiv.append("input")
            .attr("type", "radio")
            .classed("clickable", true)
            .attr("name", "skillRadio")
            .attr("id", "radio" + total)
            .attr("value", SkillList[total]);
        checkDiv.append("label")
            .classed("clickable", true)
            .attr("for", "radio" + total)
            .append("p")
            .style("display", "inline")
            .html(SkillList[total]);

        var currentRadio = document.getElementById("radio" + total);

        currentRadio.addEventListener("change", function() {
            var index = currentFilters.indexOf(this.value);
            currentFilters = [];
            if (this.checked) {
                if (index < 0) {
                    currentFilters.push(this.value);
                    // updateSelectAllCheckbox();
                }
            }
            filterSkill(currentFilters);
            if (currentSelection.length == 2) {
                displaySelection(getAllPathsBetween(currentSelection[0], currentSelection[1]));
            }
        });

    }
}

// PARAM : sélection d3 [skillDiv] permettant d'accueillir
// les infos de compétences
// RETURN : void, remplit [skillDiv] avec les compétences
function initDefaultRadio(skillDiv) {
    var checkDivDef = skillDiv.append("div")
        .attr("id", "checkdivdef")
        .attr("class", "radio-area");
    checkDivDef.append("input")
        .classed("clickable", true)
        .attr("type", "radio")
        .attr("name", "skillRadio")
        .attr("checked", "true")
        .attr("id", "radiodef")
        .attr("value", "def");
    checkDivDef.append("label")
        .attr("for", "radiodef")
        .append("p")
        .classed("clickable", true)
        .style("display", "inline")
        .html("Défaut");

    document.getElementById("radiodef").addEventListener("change", function() {
        document.getElementById("description-area").innerHTML = "Aucune compétence sélectionnée";
        var index = currentFilters.indexOf(this.value);
        currentFilters = [];
        resetSelection();
        filterSkill(currentFilters);
        if (currentSelection.length == 2) {
            displaySelection(getAllPathsBetween(currentSelection[0], currentSelection[1]));
        }
    });
}

// PARAM : selection d3 de l'element "div" du DOM contenant
// la légende des blocs [displayLegendDiv]
// RETURN : void, gere l'affichage en mode "blocs" ainsi que
// la légende de ce mode d'affichage
function displayBlocks(displayLegendDiv) {
    for (var i = 0, sortedKeys = Object.keys(groupColors).sort(); i < Object.keys(groupColors).length; i++) {
        if (!groupColors.hasOwnProperty(sortedKeys[i])) {
            continue;
        }
        var displDiv = displayLegendDiv.append("div")
            .classed("bloc-divs", true)
            .append("p")
            .style("margin", 0)
            .style("margin-bottom", "2px")
            .style("padding", "2px")
            // .style("background", "linear-gradient(to right, " + groupColors[sortedKeys[i]] + ", " + defaultBackgroundColor + ")")
            .style("border-left", "15px solid " + groupColors[sortedKeys[i]])
            .text(function(d) {
                return sortedKeys[i];
            });
    }
}

// PARAM : Tableau des donnees des noeuds et des liens [graph], donnees du fichier .json [data]
// RETURN : void, gere l'affichage du bouton de reinitialisation ainsi
// que la legende (UE en option)
function buttonsSetup(data, graph) {
    var svg = d3.select("#chart").select("g");
    var semesterLayout = d3.select("#semesterLayout").select("g");

    var links = d3.selectAll(".link");
    var nodes = d3.selectAll(".node");
    var options = d3.selectAll(".option");

    var resetViewButton = filterDiv.append("button")
        .classed("selectionButtons clickable", true)
        .text("Réinitialiser tout");

    var optionLegend = filterDiv.append("div")
        .style("width", "100%");
    optionLegend.append("div")
        .attr("id", "optionImage")
        .style("border", function() {
            return "2px dashed " + defaultSkillDisplayColor + "";
        });

    optionLegend.append("p").text("UE facultative")
        .attr("id", "optionText");

    resetViewButton.on("click", function(d) {
        sankey
            .nodes(graph.nodes)
            .links(graph.links)
            .layout(32);

        links.attr("d", path);
        nodes.attr("transform", function(d) {
            return "translate(" + d.x + "," + d.y + ")";
        });

        nodes.filter(function(node) {
            return currentSelectedOptions.indexOf(+node.ueid) != -1;
        }).each(function(node) {

            hideCircleAndMoveToInitPos(node);

            showUEAndDuplicates(data, +node.ueid);

            sankey.relayout();
            d3.selectAll(".link").attr("d", path);

            removeOptionFromSelection(options, node);
        });

        // svg.attr("transform",
        //     "translate(" + svgPadding.left + "," + svgPadding.top + ") scale(1)");
        // zoomHandler(svg, semesterLayout, 3, "resetScale");
    });
}

// PARAM : Tableau des donnees des noeuds et des liens [graph], selection d3
// de l'element "div" du DOM contenant les radios
// de l'affichage par competences [skillDiv],
// selection d3 de l'element "div" du DOM contenant
// la légende des blocs [displayLegendDiv]
// RETURN : void, gere les changements d'affichage
// du diagramme lors d'un changement de mode
function changeMode(graph, skillDiv, displayLegendDiv) {
    var links = d3.selectAll(".link");

    var colorRects = d3.selectAll(".colorRect");

    var radios = document.getElementsByName("displayMode");
    radios.forEach(function(button) {
        button.addEventListener("change", function() {
            switch (this.value) {
                case "skillDisplay":
                    filterSkill(currentFilters);
                    applyColours(this.value);
                    skillDiv.style("display", "block");
                    displayLegendDiv.style("display", "none");
                    displayLinks(links);
                    colorRects.style("display", "none");
                    break;
                case "groupDisplay":
                    resetSelection();
                    filterSkill(getSkillList(graph.competences));
                    applyColours(this.value);
                    skillDiv.style("display", "none");
                    displayLegendDiv.style("display", "block");
                    hideLinks(links);
                    colorRects.style("display", "block");
                    break;

                default:
                    console.log("erreur");
                    break;

            }
        });
        // initialise l'affichage
        if (button.checked) {
            button.dispatchEvent(new Event("change"));
        }
    })
}

// PARAM : tableau comportant toutes les compétences [SkillList]
// RETURN : void, initialise la checkbox "(De)Sélectionner tout"
// UTILISEE DANS UNE ANCIENNE VERSION AVEC SELECTION MULTIPLE DE COMPETENCES
function selectAllSetup(SkillList) {
    var selectAllCheckbox = filterDiv.append("input")
        .attr("type", "checkbox")
        .attr("id", "selectallcheckbox")
        .attr("checked", "true");

    var selectAllLabel = filterDiv.append("label")
        .attr("for", "selectallcheckbox")
        .attr("id", "selectalllabel")
        .append("p")
        .style("display", "inline")
        .html("(Dé)sélectionner tout");

    document.getElementById("selectallcheckbox").addEventListener("change", function() {
        if (this.checked) {
            for (var i = 0; i < SkillList.length; i++) {
                document.getElementById("checkbox" + i).checked = true;
                document.getElementById("checkbox" + i).dispatchEvent(new Event("change"));
            }
        } else {
            for (var i = 0; i < SkillList.length; i++) {
                document.getElementById("checkbox" + i).checked = false;
                document.getElementById("checkbox" + i).dispatchEvent(new Event("change"));
            }
        }
    });

    document.getElementById("selectalllabel").addEventListener("mousedown", function(e) {
        e.preventDefault();
    }, false);
}

// BRIEF : vide la sélection de noeuds courante,
// et met à jour les styles en conséquence
function resetSelection() {
    var nodes = d3.selectAll(".node");
    var links = d3.selectAll(".link");
    currentSelection = [];
    nodes.selectAll("rect").style("stroke", applyBorderColours(getDisplayMode())).style("stroke-width", "2px");
    applyDefaultOpacity(nodes, links);
}

// PARAM : tableau de compétences [SkillList] et leurs descriptions [descriptions]
// RETURN : void, gère l'affichage des descriptions
// de chaque compétence onmouseover dans la zone prévue à cet effet
function setSkillDescription(SkillList, descriptions) {
    var descriptionDiv = filterDiv.append("div");
    var descriptionTitle = descriptionDiv.append("h2").text("Description de compétence");
    var descriptionContent = descriptionDiv.append("p")
        .attr("id", "description-area");

    //texte par défaut
    document.getElementById("description-area").innerHTML = "Aucune compétence sélectionnée";


    for (var total = 0; total < SkillList.length; total++) {
        document.getElementById("checkdiv" + total).addEventListener("click", function() {
            document.getElementById("description-area").innerHTML = descriptions[this.firstChild.value];
        });
    }
}

// PARAM : tableau de compétences [SkillList]
// RETURN : void, applique la couleur de fond de
// chaque compétence au niveau des radios
function RadioLabelColor(SkillList) {
    for (var total = 0; total < SkillList.length; total++) {
        var checkdiv = document.getElementById("checkdiv" + total);
        var currentColor = skillColors[checkdiv.firstChild.value];
        // checkdiv.style.backgroundColor = currentColor;
        // checkdiv.style.background = "linear-gradient(to right, " + currentColor + ", " + defaultBackgroundColor + ")";
    }
}

// PARAM : Nombre d'ECTS d'une UE
// RETURN : void, applique la mise en forme ci-dessous pour affichage
function printECTS(ects) {
    return "ECTS : " + ects;
}

// PARAM : Noeud UE de départ [nodeA] et noeud UE d'arrivée [nodeB]
// RETURN : tableau de tableaux représentants les chemins menant de [nodeA] vers
// [nodeB]
function getAllPathsBetween(nodeA, nodeB) {
    var links = d3.selectAll(".link");

    var currentpath = [nodeA];
    var pathlist = [];
    getAllPathsBetweenRec(nodeA, nodeB, currentpath, pathlist, links);

    return pathlist;
}

// BRIEF : recursion de la fonction getAllPathsBetween
function getAllPathsBetweenRec(nodeA, nodeB, currentpath, pathlist, links) {

    if (+nodeA.ueid === +nodeB.ueid) {
        pathlist.push(currentpath.slice());
    }

    var adjacentNodes = getChildren(nodeA);
    for (var i = 0; i < adjacentNodes.length; i++) {
        if (hasActiveLinkBetweenNodes(nodeA, adjacentNodes[i], links.data())) {
            currentpath.push(adjacentNodes[i]);
            getAllPathsBetweenRec(adjacentNodes[i], nodeB, currentpath, pathlist, links);
            currentpath.pop();
        }
    }
}

// PARAM : Noeud UE concerné [node]
// RETURN : tableau des successeurs directs de [node]
function getChildren(node) {
    var children = [];
    node.sourceLinks.forEach(function(d, i) {
        if (children.indexOf(d.target) == -1) {
            children.push(d.target);
        }
    });
    return children;
}

// PARAM : [d]: Données rattachées au noeud à sélectionner
// RETURN : void
// Ajoute le noeud considéré à la liste des noeuds sélectionnés
// (currentSelection) si la liste contient moins de deux éléments
// ou retire le noeud de la liste si il était déjà dedans
function selectNode(d) {

    var links = d3.selectAll(".link");
    var nodes = d3.selectAll(".node");

    var exist = currentSelection.indexOf(d);
    if (exist >= 0) {
        currentSelection.splice(exist, 1);
        applyDefaultOpacity(nodes, links);
        displayLinks(links);
        displayNodes(nodes);
        filterSkill(currentFilters);
    } else if (currentSelection.length < 2) {
        currentSelection.push(d);
        if (currentSelection.length == 2 && +currentSelection[0].semestre != +currentSelection[1].semestre) {
            currentSelection.sort(function(a, b) {
                return a.semestre - b.semestre;
            });
        } else if (currentSelection.length == 2 && +currentSelection[0].semestre == +currentSelection[1].semestre) {
            currentSelection[0].targetLinks.forEach(function(link) {
                if (+link.source.ueid == +currentSelection[1].ueid) {
                    var tmp = currentSelection[0];
                    currentSelection[0] = currentSelection[1];
                    currentSelection[1] = tmp;
                }
            });
        }
    }

    if (currentSelection.length == 2) {
        displaySelection(getAllPathsBetween(currentSelection[0], currentSelection[1]));
    }
}

// PARAM : [pathArray]: tableau de tableaux des chemins a afficher
// RETURN : void
// Cache les noeuds et liens ne faisant parti d'aucun chemin
// et change l'opacite des noeuds affichés
function displaySelection(pathArray) {

    var links = d3.selectAll(".link");
    var nodes = d3.selectAll(".node");

    hideLinks(links);
    nodes.style("opacity", 0.2);

    if (!pathArray.length) {
        nodes.filter(function(d, i) {
            return (+d.ueid === +currentSelection[0].ueid ||
                +d.ueid === +currentSelection[1].ueid);
        }).style("opacity", "1");
    }

    pathArray.forEach(function(path) {
        for (var k = 0; k < path.length; k++) {
            if (k != path.length - 1) {
                displayLinks(links.filter(function(d, i) {
                    return (d.source === path[k] &&
                        d.target === path[k + 1] &&
                        currentFilters.includes(d.linktype));
                }).style("opacity", "1"));
            }

            nodes.filter(function(d, i) {
                return (+d.ueid === +path[k].ueid &&
                    checkNodeDisplay(d, currentFilters));
            }).style("opacity", "1");
        }
    });
}

// PARAM : Noeud UE concerné [node]
// RETURN : tableau des compétences impliquées par l'UE [node]
function getSkillsOfUE(node) {
    var skills = [];
    if (node.dependances) {
        node.dependances.forEach(function(d, i) {
            skills.push(d[0]);
        });
    }
    return skills;
}

// PARAM : objet noeud [nodeA],[nodeB], et tableau de liens [links]
// RETURN : bool = true si les noeuds [nodeA] et [nodeB] ont un lien direct
// entre eux dans le filtrage courant de compétences ( = currentFilters)
// false sinon
function hasActiveLinkBetweenNodes(nodeA, nodeB, links) {
    var returnVal = false;
    links.forEach(function(d, i) {
        if (currentFilters.includes(d.linktype) &&
            d.source == nodeA &&
            d.target == nodeB) {
            returnVal = true;
        }
    });
    return returnVal;
}

// PARAM : [node]: Tableau des donnees rattachées au noeud
// [currentFilters]: tableau des filtres courants
// RETURN : Boolean => True si node fait travailler une des
// competences actuellement affichees, false sinon
function checkNodeDisplay(node, currentFilters) {
    var flag = false;

    for (var i = 0; i < node.dependances.length && flag == false; i++) {
        if (currentFilters.includes(node.dependances[i][0])) {
            flag = true;
        }
    }

    return flag;
}

// PARAM : [node]: Tableau des donnees rattachées au noeud
// RETURN : Tableau de toutes les compétences travaillées par l'UE
// mais sans lien
// (dans le JSON, compétence représentée sous la forme ["Appliquer"])
function getIgnoredSkills(node) {
    var ignoredSkills = [];
    node.dependances.forEach(function(skill) {
        if (skill.length == 1)
            ignoredSkills.push(skill[0]);
    });

    return ignoredSkills;
}

// RETURN : renvoie le mode d'affichage courant
function getDisplayMode() {
    var modes = document.getElementsByName("displayMode");
    for (var i in modes) {
        if (modes[i].checked) {
            return modes[i].value;
        }
    }
}

// PARAM : données json [data], tableau des choix possibles
// pour une option [selectionArray]
// RETURN : tableau de choix filtré où les choix déjà pris sont retirés (peu
// importe le semestre où l'UE est choisie)
function filterUESelection(data, selectionArray) {
    var filteredArray = [];
    selectionArray.forEach(function(d, i) {
        if (!currentSelectedOptions.includes(+d) &&
            !arrayInter(currentSelectedOptions, getDuplicatesOfUE(data, +d)).length) {
            filteredArray.push(+d);
        }
    });
    return filteredArray;
}

// PARAM : deux tableaux [arrA] et [arrB]
// RETURN : tableau intersection des deux tableaux
function arrayInter(arrA, arrB) {
    return arrA.filter(function(d) {
        return arrB.indexOf(d) > -1;
    });
}

// PARAM : données json [data], ID d'ue [id]
// RETURN : tableau comportant l'ue avec l'id [id] ainsi que ses doublons
//dans les autres semestres
function getDuplicatesOfUE(data, id) {
    var duplicates = data.ueDoublons;

    duplicates.forEach(function(d) {
        d.forEach(function(d1, i1, arr1) {
            return arr1[i1] = +d1;
        });
    });

    var duplicatesOfUE = [id];
    duplicates.forEach(function(d, i) {
        if (d.includes(id)) {
            duplicatesOfUE = d;
        }
    });
    return duplicatesOfUE;
}

// PARAM : données json [data], ID d'ue [id]
// RETURN : tableau comportant les doublons de l'UE d'id [id] sans l'ue elle
// même. Cela sert à cacher les doublons une fois l'UE sélectionnée
function hideDuplicatesOfUE(data, id) {
    var duplicates = data.ueDoublons;
    var duplicatesOfUE = [];
    duplicates.forEach(function(d, i) {
        if (d.includes(id)) {
            d.forEach(function(d) {
                if (+d !== +id) {
                    duplicatesOfUE.push(+d);
                }
            });
        }
    });
    return duplicatesOfUE;
}

// PARAM : données json [data], ID d'ue [id]
// RETURN : bool, true si l'UE a des doublons dans d'autres semestres, false sinon
// exemple : Droit S4 et S6 sont doublons chacun l'un de l'autre, c'est le même
// contenu d'UE mais à un semestre différent
function isUEDuplicated(data, id) {
    var duplicates = data.ueDoublons;
    var ret = false;
    duplicates.forEach(function(d, i) {
        if (d.includes(+id)) {
            ret = true;
        }
    });

    return ret;
}

// PARAM : données json [data], ID d'ue [id]
// RETURN : l'objet option du .json avec l'id [id] correspondant
function getOptionById(data, id) {
    var option;
    var options = data.options;
    options.forEach(function(d, i) {
        if (+d.id === +id) {
            option = d;
        }
    });
    return d;
}

// RETURN : void, gere l'affichage de la ligne de separation entre
// la zone d'options et celle des UEs
function setupAreaSeparator(UEArray, yPos) {
    var optionScale = d3.scaleLinear()
        .domain(getMinMaxSemester(UEArray))
        .range([svgPadding.left, width - (sankey.nodeWidth()) - (svgPadding.right / 2)]);
    var tab = getMinMaxSemester(UEArray);
    var chartCenter = (margin.left + svgPadding.left + width) / 2;

    d3.select("#chart")
        .append("g")
        .attr("id", "areaSeparator")
        .append("line")
        .attr("x1", 0)
        .attr("x2", margin.left + svgPadding.left + width)
        .attr("y1", yPos)
        .attr("y2", yPos);

    d3.select("#optionZone")
        .attr("transform", "translate(0," + yPos + ")")
        .append("rect")
        .attr("width", margin.left + svgPadding.left + width)
        .attr("height", height);

    for (var i = tab[0]; i <= tab[1]; i++) {
        d3.select("#areaSeparator")
            .append("g")
            .attr("id", "separator" + i)
            .attr("class", "separator")
            .attr("transform", "translate(" + optionScale(i) + "," + yPos + ")")
            .attr("width", sankey.nodeWidth())
            .append("rect")
            .attr("height", 25)
            .attr("width", sankey.nodeWidth())
            .attr("rx", 2)
            .attr("ry", 2);

        d3.select("#separator" + i)
            .append("text")
            .attr("y", 13)
            .attr("dy", ".35em")
            .attr("transform", "translate(" + (sankey.nodeWidth() / 2) + "," + 0 + ")")
            .style("text-anchor", "middle")
            .text("Options S" + i)
            .style("font-size", adaptLabelFontSize);
    }
}

// RETURN : void, la fenetre d'info d'UE
function initInfoWindow() {

    var infoWindow = d3.select("body").append("div")
        .style("width", width + "px")
        .style("height", height + "px")
        .style("position", "absolute")
        .style("left", 8 + "px")
        .style("top", 8 + "px")
        .style("opacity", "0.9")
        .style("height", height + "px")
        .style("display", "none")
        .attr("id", "infoWindow");

    var closeInfoWindow = infoWindow.append("div")
        .classed("clickable", true)
        .style("width", "50px")
        .style("height", "50px")
        .style("opacity", "0.7")
        .style("float", "right")
        .style("color", "white")
        .style("text-align", "center")
        .style("background-color", "black")
        .on("click", function(d, i) {
            d3.select("#infoWindow").style("display", "none");
        }).append("p")
        .html("X");

    var infoWindowText = infoWindow.append("p")
        .style("color", "white")
        .style("padding", "150px")
        .style("text-align", "justify")
        .html("<u>Pré-requis</u><br/><br/> Programme de TS toutes spécialités confondues. <br/><br/><u>Contenu</u><br/><br/> Arithmétique dans Z. Division euclidienne. Diviseurs communs à deux entiers, pgcd, ppcm, lemme de Gauss. Théorème de Bézout. Algorithme dEuclide de calcul de pgcd. Nombres premiers. Existence et unicité de la décomposition en produit de facteurs premiers. Congruences : additions et multiplications. Systèmes de congruences, théorème chinois. Polynômes, somme, produit, fonctions polynômiales. Annulation en un point et factorisation par X -a.<br/><br/>Algèbre linéaire. Systèmes linéaires dans R^n, résolution par méthode du pivot. Matrices, produit de matrices, traduction des opérations de lignes et de colonnes. Calculs de noyaux et d'images. <br/><br/><u>Objectifs : savoir-faire et compétences</u><br/><br/> Résoudre de manière autonome des problèmes liés ou faisant appel à l'arithmétique élémentaire et à l'algèbre linéaire.");
}

// RETURN : void, gère la taille du svg au redimensionnement de fenetre
function resize() {
    window.addEventListener("resize", function() {
        width = window.innerWidth - margin.left - margin.right;
        sankey
            .nodes(graph.nodes)
            .links(graph.links)
            .options(graph.options)
            .layout(32);

        d3.selectAll(".link").attr("d", path);
        d3.selectAll(".noderesize").attr("transform", function(d) {
            return "translate(" + d.x + "," + d.y + ")";
        });
        svg.attr("transform",
            "translate(" + svgPadding.left + "," + svgPadding.top + ") scale(1)");
        // zoomHandler(svg, semesterLayout, 3, "resetScale");
        d3.selectAll("svg").style("width", width);
        d3.select("#semesterLayout").style("width", width);

    });
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


// BRIEF : gère les fermetures de fenetre/dropdown à la pression de "échap"
function escapeEvents() {
    document.addEventListener("keydown", function(event) {
        const keyName = event.key;
        if (keyName === "Escape") {
            d3.select("#dropdown").remove();
            d3.select("#infoWindow").style("display", "none");
        }
    });

}

function update(jsonName) {
    sessionStorage.removeItem("json");

    // Parsing du json, necessite un serveur web (local ou non) pour fonctionner !!!
    // Le fichier peut être remplacé par un autre fichier valide.
    d3.json(jsonName).then(function(data) {

        // Création de l'objet graphe
        // On y insère les données parsées du json
        graph = {
            "nodes": data.ue,
            "options": data.options,
            "links": getLinks(data.ue),
            "categories": [],
            "competences": []
        };


        // récupération des catégories renseignées dans le fichier json
        data.categories.forEach(function(cat) {
            graph.categories.push(cat.name);
            groupColors[cat.name] = cat.color;
        });

        // récupération des compétences renseignées dans le fichier json
        data.competences.forEach(function(comp) {
            graph.competences.push(comp);
            skillColors[comp.name] = comp.color;
            skillDescriptions[comp.name] = comp.description;
        });

        // Désactiver le menu contextuel au clic droit lorsque la souris est sur le SVG
        d3.select("#chart").on("contextmenu", function() {
            d3.event.preventDefault();
        });

        // Initialisation des filtres (= toutes les compétences existantes ici)
        // currentFilters = getSkillList(graph.nodes);

        // Calcul de la dispoition des noeuds et liens du diagramme de sankey
        var nodeW = function() {
            var sem = getMinMaxSemester(graph.nodes);
            var res = 30 * 10 / (0.5 * sem[1]);
            if (res < 70) {
                res = 70;
            } else if (res > 150) {
                res = 150;
            }
            return res;
        }

        sankey.nodeWidth(nodeW())
            .nodes(graph.nodes)
            .options(graph.options)
            .links(graph.links)
            .categories(graph.categories)
            .competences(graph.competences)
            .layout();

        // Setup ligne de separation zone d'option
        if(data.options.length != 0){
            var separatorYPos = sankey.highestOptionY() + 20;
            setupAreaSeparator(graph.nodes, separatorYPos);
        }

        //Mise en place de l'affichage des semestres sous le SVG du graphe
        displaySemesters(graph.nodes);

        // selection d3 des liens avec les données du sankey bindées
        var link = svg.append("g").selectAll(".link")
            .data(graph.links)
            .enter().append("path")
            .attr("class", "link")
            .attr("d", path)
            .style("stroke-width", function(d) {
                return Math.max(1, d.dy);
            })
            .sort(function(a, b) {
                return b.dy - a.dy;
            });

        // Initialisation de l'affichage des liens
        // displayLinks(link);

        // selection d3 des noeuds avec les données du sankey bindées
        var node = svg.append("g").selectAll(".node")
            .data(graph.nodes)
            .enter().append("g")
            .attr("class", "node noderesize")
            .attr("transform", function(d) {
                return "translate(" + d.x + "," + d.y + ")";
            })
            .attr("width", sankey.nodeWidth())
            // Gestion du drag des noeuds
            .call(d3.drag()
                .clickDistance(5)
                .on("drag", dragmove)
            );

        // Noeuds d'options
        var option = svg.append("g").selectAll(".option")
            .data(graph.options)
            .enter().append("g")
            .attr("class", "clickable option noderesize")
            .attr("transform", function(d) {
                return "translate(" + d.x + "," + d.y + ")";
            })
            .attr("width", sankey.nodeWidth());


        option.on("click", function(d) {
            backgroundClick = false;
            initDropdown(graph.nodes, d, data);
            disableTooltip();

        }).on("mouseover", function(d) {
            d3.select(this).select("rect").style("fill", optionNodeMouseOverColor); //option node mouseover color
            if (lastClickedOptionNode !== d || d3.select("#dropdown").empty()) {
                enableTooltip("Cliquer pour choisir une option" + "<br/>" +
                    printECTS(d.coefficient));
            }

        }).on("mouseout", function(d, i) {
            d3.select(this).select("rect").style("fill", optionNodeColor);

            // Disparition de l'infobulle
            disableTooltip();
        });

        // Boutons de suppression d'option qui apparait lorsqu'une ue est choisie
        // en option
        initOptionDeleteButton(data, node, option);


        // selection d3 des rects du svg (= les rectangles de chaque noeud avec
        // couleur d'arrière plan )
        var nodeRects = node.append("rect")
            .attr("height", function(d) {
                return d.dy;
            })
            .attr("width", sankey.nodeWidth())
            // .attr("rx", 2)
            // .attr("ry", 2)
            .style("fill", applyColours("skillDisplay"))
            .classed("option", function(d) {
                return (d.option == "true");
            })
            .classed("facultatif", function(d) {
                return (d.facultatif == "true");
            })
            .style("stroke", function(d) {
                return applyBorderColours(getDisplayMode());
            })
            .on("click", function() {
                d3.select("#infoWindow").style("display", "block");
            });

        var nodeColors = node.append("rect")
            .attr("class", "colorRect")
            .attr("height", function(d) {
                return d.dy + 2;
            })
            .attr("width", "10px")
            .attr("transform", "translate(-10,-1)")
            // .attr("rx", 2)
            // .attr("ry", 2)
            .style("fill", function(d) {
                return groupColors[d.categorie]
            })
            .style("stroke", function(d) {
                return applyBorderColours(getDisplayMode());
            });

        var optionRects = option.append("rect")
            .attr("height", function(d) {
                return d.dy;
            })
            .attr("width", sankey.nodeWidth())
            // .attr("rx", 2)
            // .attr("ry", 2)
            .style("stroke", function(d) {
                return optionBorderColor;
            })
            .style("fill", optionNodeColor);

        // Initialisation de l'affichage des noeuds
        displayNodes(nodeRects);


        // sélection d3 des textes au niveau des noeuds
        var nodeTexts = node.append("text")
            .attr("y", function(d) {
                return d.dy / 2;
            })
            // .attr("x", d3.select(".colorRect").attr("width"))
            .attr("dy", ".35em")
            .attr("transform", "translate(" + (sankey.nodeWidth() / 2) + "," + 0 + ")")
            .style("text-anchor", "middle")
            .style("fill", nodeTextColor)
            .text(function(d) {
                return d.abreviation;
            })
            .style("font-size", adaptLabelFontSize)
            .filter(function(d) {
                return d.x < width / 2;
            });

        var optionTexts = option.append("text")
            .attr("y", function(d) {
                return d.dy / 2;
            })
            .attr("dy", ".35em")
            .attr("transform", "translate(" + (sankey.nodeWidth() / 2) + "," + 0 + ")")
            .style("text-anchor", "middle")
            .text(function(d) {
                return "Option S" + d.semestre;
            })
            .style("font-size", adaptLabelFontSize)
            .filter(function(d) {
                return d.x < width / 2;
            });

        // gestion des évenements liés aux noeuds
        node.on("mouseover", function(d, i) {
                // Affichage de l'infobulle et mise à jour de ses informations
                var projetDescription = (d.projet == "true") ?
                    "Cette UE comporte un projet" :
                    "";

                enableTooltip(d.name + "<br/>" +
                    printECTS(d.coefficient) + "<br/>" +
                    projetDescription);
            })
            .on("mouseout", function(d, i) {
                // Disparition de l'infobulle
                disableTooltip();

            })
            .on("contextmenu", function(d, i) {

                // sélection en mode compétence uniquement et
                // lorsqu'une compétence est sélectionnée
                if (getDisplayMode() !== "skillDisplay" ||
                    document.getElementById("radiodef").checked) {
                    return;
                }
                // Ajoute le noeud "d" cliqué s'il n'est pas deja dans currentSelection
                selectNode(d);

                // style noeuds sélectionnés
                node.filter(function(d, i) {
                        return currentSelection.includes(d);
                    }).selectAll("rect")
                    .style("stroke", "black")
                    .style("stroke-width", "4px");

                // style noeuds non sélectionnés
                node.filter(function(d, i) {
                        return !currentSelection.includes(d);
                    }).selectAll("rect")
                    .style("stroke", applyBorderColours(getDisplayMode())).style("stroke-width", "2px");

                // Affichage par défaut quand rien n'est sélectionné
                if (currentSelection.length == 0)
                    filterSkill(currentFilters);

                // Mise en valeur quand un seul noeud est sélectionné
                if (currentSelection.length == 1) {
                    link.style("opacity", "0.2");
                    node.style("opacity", "0.2");
                    valoriseAdjacentLinks(currentSelection[0]).style("opacity", "1");
                    valoriseAdjacentNodes(currentSelection[0], currentFilters)
                        .style("opacity", "1");
                }

            });

        var SkillList = getSkillList(graph.competences);
        filterSkill(currentFilters);
        filterDisplayManager(data, SkillList, graph);
        setSkillDescription(SkillList, skillDescriptions);
        RadioLabelColor(SkillList);

        // fonction gérant le drag
        function dragmove(d) {
            d3.select("#dropdown").remove();
            d3.select(this)
                .attr("transform",
                    "translate(" +
                    d.x + "," +
                    (d.y = Math.max(-48, Math.min(height - d.dy - svgPadding.bottom, d3.event.y))) + ")");
            sankey.relayout();
            link.attr("d", path);
        }

    });

}
