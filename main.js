metricDistances = ["30m", "40m", "50m", "60m"];
imperialDistances = ["20yd", "30yd", "40yd", "50yd", "60yd", "70yd", "80yd", "90yd", "100yd", "110yd"];
//const agbOutdoorImperial = require("res/AGB_outdoor_imperial.json");
var agbOutdoorImperial, agbOutdoorMetric, allRounds, roundName;

var end_arrows, roundID, n_ends;

const db = new Dexie("ArcheryBuddy");
db.version(2).stores({
    sightMarks: '++id, distance',
    scores: '++id, round, final'
});


$(document).ready(async function () {
    await parseRounds()
    populateScoreSheets()
    populateSavedRounds()
    populateSightMarkSelect()
    populateRecordRoundSelect()
    populateSightMarkTable()
    populateIndividualMarks()
    showCard("recordRound")

});

async function parseRounds() {
    agbOutdoorImperial = await $.getJSON("res/AGB_outdoor_imperial.json");
    agbOutdoorMetric = await $.getJSON("res/AGB_outdoor_metric.json");
    allRounds = agbOutdoorImperial.concat(agbOutdoorMetric);
}

function recordRound() {
    showCard("recordRound")
    hide("#roundSheet")
    show("#loadingCard")
}

//Add all distances to the addSightMarkSelect Select as an option
function populateSightMarkSelect() {
    for (dropdown of ["#addSightMarkSelect", "#viewSightMarksSelect"]) {
        processList(metricDistances)
        processList(imperialDistances)
        function processList(list) {
            for (distance of list) {
                newElement = document.createElement("option");
                newElement.value = distance;
                newElement.innerHTML = distance;
                document.querySelector(dropdown).appendChild(newElement);
            }
        }
    }
}

//Generate Record Table Based on recordRoundSelect
function populateRecordRoundSelect() {
    for (round of allRounds) {
        newElement = document.createElement("option");
        newElement.value = round.name;
        newElement.innerHTML = round.name;
        document.querySelector("#recordRoundSelect").appendChild(newElement);
    }
}

//Populate Sight Mark Table
function populateSightMarkTable() {
    let smt = document.querySelector("#sightMarkTable");
    smt.innerHTML = "";
    processList(metricDistances.concat(imperialDistances));
    //    processList(imperialDistances);

    async function processList(distances) {
        for (distance of distances) {
            let dbrow = await db.sightMarks.where("distance").equals(distance).toArray();
            if (dbrow.length == 0) {
                continue;
            }
            let last = dbrow.length - 1;
            console.log(dbrow);
            let newRow = document.createElement("tr");
            let tag = document.createElement("td");
            tag.innerHTML = dbrow[last]["distance"]
            let value = document.createElement("td");
            value.innerHTML = dbrow[last]["mark"]
            /*let date = document.createElement("td");
            date.innerHTML = dbrow[last]["date"]*/
            newRow.appendChild(tag);
            newRow.appendChild(value);
            //newRow.appendChild(date);
            smt.appendChild(newRow);
        }
    }
}

//Populate Individual Marks Tables
async function populateIndividualMarks() {
    let parent = document.querySelector("#individualSightMarkTable")
    let selectedMark = document.querySelector("#viewSightMarksSelect").value;
    parent.innerHTML = "";
    let marks = await db.sightMarks.where("distance").equals(selectedMark).toArray();
    console.log("marks")
    console.log(marks)
    if (marks.length == 0) {
        return;
    }
    for (mark of marks) {

        let tr = document.createElement("tr");

        let td1 = document.createElement("td");
        td1.innerHTML = mark["distance"]

        let td2 = document.createElement("td");
        td2.innerHTML = mark["mark"]

        let td3 = document.createElement("td");
        td3.innerHTML = mark["date"]

        for (each of [td1, td2, td3]) {
            tr.appendChild(each)
        }
        parent.appendChild(tr)
    }



}

//Show/Hide Cards
function showCard(cardName) {
    for (id of ["sightMarks", "recordRound", "stats"]) {
        let e = document.querySelector("#" + id);
        e.style.display = "none"
    }
    let e = document.querySelector('#' + cardName);
    e.style.display = "block"
}


//Dexie stuff


function addSightMark() {
    let dist = document.querySelector("#addSightMarkSelect").value
    let mark = document.querySelector("#addSightMarkText").value
    if (mark == "") {
        return false;
    }
    let time = new Date().toDateString();
    db.sightMarks.put({ "distance": dist, "mark": mark, "date": time })
    populateSightMarkTable();
}

function getRoundByName(namestr) {
    return allRounds.filter(
        function (data) { return data.name == namestr }
    );
}

function generateRoundSheetFromSelect() {
    let round = document.querySelector("#recordRoundSelect").value;
    generateRoundSheet(round);

}

function generateRoundSheet(inputRound) {
    hide("#loadingCard")
    console.log(inputRound);
    let round = getRoundByName(inputRound)[0];
    roundName = round.name;
    roundID = new Date().getTime();
    let parent = document.querySelector("#roundSheet");
    end_arrows = 6;
    let endNum = 0;
    parent.innerHTML = "";
    console.log(round)

    let t = document.createElement("h3");
    t.innerHTML = roundName;
    parent.appendChild(t);

    let id = document.createElement("p");
    id.innerHTML = roundID;
    id.style.fontSize = "xx-small";
    id.id = "roundID";
    parent.appendChild(id);

    let note = document.createElement("input");
    note.classList.add("form-control");
    note.id = "recordNote";
    note.type = "text";
    note.placeholder = "Event Name / Note"
    parent.appendChild(note);
    parent.appendChild(breakRow())

    for (pass of round.passes) {
        n_ends = pass.n_arrows / end_arrows;
        console.log(n_ends);
        //Make label with distance
        let h = document.createElement("h4");
        h.innerHTML = pass.distance + pass.dist_unit
        h.classList.add("text-end")
        parent.appendChild(h)


        for (let i = 0; i < n_ends; i++) {
            endNum++
            let endID = "end_" + endNum;

            let endTitle = document.createElement("h6");
            endTitle.innerHTML = "End " + endNum;
            parent.appendChild(endTitle);



            let row = newRow();


            for (let j = 0; j < end_arrows; j++) {
                row.appendChild(scoreInput(endID + "_a_" + (j + 1)));
            }

            let row2 = newRow();


            for (field of ["a_hits", "a_miss", "a_golds", "a_x", "a_total"]) {
                row2.appendChild(scoreInfo(endID + "_" + field));
            }

            parent.appendChild(row);
            parent.appendChild(row2);
            row.addEventListener("change", function () {
                totalise("#" + endID);
                saveScore();
            })
            parent.appendChild(breakRow())
        }
        parent.appendChild(breakRow())

        //Create sheet for pass.n_arrows / 6 or 3 depending on end size

        //Table has 6 or 3 score entries + hits, Xs, golds, running total 

    }
    //parent.appendChild(saveButton()); Removed as form now saves automatically
    parent.appendChild(deleteButton());
    parent.appendChild(submitButton());

    parent.style.display = "block";
}

//Get total field totalise(end_1)
//a_tot child of end_1 
//get 
function newRow() {
    let row = document.createElement("div");
    row.classList.add("d-flex")
    row.classList.add("flex-nowrap")

    return row
}
function totalise(id) {
    let parent = document.querySelector(id)
    let ele_hits = document.querySelector(id + "_a_hits");
    let ele_golds = document.querySelector(id + "_a_golds");
    let ele_total = document.querySelector(id + "_a_total");
    let ele_miss = document.querySelector(id + "_a_miss");
    let ele_exes = document.querySelector(id + "_a_x");

    let total = 0;
    let hits = 0;
    let golds = 0;
    let exes = 0;
    let misses = 0;

    for (i = 0; i < end_arrows; i++) {
        let arrow = i + 1;
        let arrowid = id + "_" + "a_" + arrow;
        console.log(arrowid);
        let val = document.querySelector(arrowid).value;
        switch (val) {
            case "x":
            case "X":
                exes++
                val = 10
                break;
            case "m":
            case "M":
                misses++
                val = 0
                break;
        }
        total += parseInt(val == "" ? 0 : val);

        if (val > 0) {
            hits++
        }
        if (val >= 9) {
            golds++
        }
    }
    ele_hits.innerHTML = "Hits<br>" + hits;
    ele_golds.innerHTML = "Golds<br>" + golds;
    ele_total.innerHTML = "Total<br>" + total;
    ele_miss.innerHTML = "Misses<br>" + misses;
    ele_exes.innerHTML = "Xs<br>" + exes;

}

function scoreInput(id) {
    let ele = document.createElement("input")
    ele.classList.add("form-control")
    ele.classList.add("arrowEntry")
    ele.type = "text"
    ele.id = id
    ele.maxLength = "2"

    return ele
}

function scoreInfo(id) {
    let ele = document.createElement("label")
    ele.classList.add("form-control")
    ele.classList.add("bg-light")
    ele.classList.add("text-center")
    ele.readOnly = true;
    ele.size = "2"
    ele.id = id
    return ele
}

/*function saveButton() {
    let ele = document.createElement("button")
    ele.type = "button"
    ele.innerHTML = "Save"
    ele.classList.add("btn")
    ele.classList.add("btn-warning")
    return ele
} -- Now Saves Automagically*/

function submitButton() {
    let ele = document.createElement("button")
    ele.type = "button"
    ele.innerHTML = "Submit"
    ele.classList.add("btn")
    ele.classList.add("btn-success")
    ele.onclick = submitScore;
    return ele
}

function deleteButton() {
    let ele = document.createElement("button")
    ele.type = "button"
    ele.innerHTML = "Delete Scorecard"
    ele.classList.add("btn")
    ele.classList.add("btn-danger")
    ele.onclick = deleteScorecard;
    return ele;
}

async function deleteScorecard() {
    let confirmText = "This will permanently delete this scorecard, are you sure?"
    if (!confirm(confirmText)) {
        return false;
    }
    wipe("#roundSheet")
    hide("#roundSheet")
    let scorecard = document.querySelector("#roundSheet");
    scorecard.innerHTML = "";
    scorecard.style.display = "none";
    let id = parseInt(roundID);
    await db.scores.where("id").equals(id).delete()
    populateSavedRounds();
    show("#loadingCard")
    return true;

}

function breakRow() {
    let ele = document.createElement("br");
    return ele
}

function genScore() {
    let datestamp = new Date().toDateString();
    let newScore = {
        id: roundID,
        round: roundName,
        ends: n_ends,
        arrowsPerEnd: end_arrows,
        final: 0,
        date: datestamp,
    }
    let scoreElements = document.querySelectorAll(".arrowEntry");
    let scores = []
    for (element of scoreElements) {
        scores.push(element.value ?? "");
    }
    newScore.scores = scores;

    let noteElement = document.querySelector("#recordNote");
    newScore.note = noteElement.value;

    return newScore;
    //get all inputs within elements within end_x for each end
}


function saveScore() {
    db.scores.put(genScore());
    populateSavedRounds();
    populateScoreSheets();
}

function submitScore() {
    let atext = "This will finalise your score, are you sure?";
    if (confirm(atext)) {
        score = genScore();
        score.final = 1;
        db.scores.put(score);
    }
    populateSavedRounds();
    populateScoreSheets();
    wipe("#roundSheet")
    hide("#roundSheet")
    /*loadRoundStats(score.id)
    showCard("stats")*/
}

async function populateSavedRounds() {
    let ele = document.querySelector("#loadRoundSelect");
    ele.innerHTML = "";
    let savedRounds = await db.scores.where("final").equals(0).toArray();
    console.log(savedRounds);
    for (round of savedRounds) {
        ele.appendChild(selectOption(round.id, (round.round + " - " + round.date)));
    }
}

async function populateScoreSheets() {
    let ele = document.querySelector("#scoreSheetSelect");
    ele.innerHTML = "";
    let savedRounds = await db.scores.where("final").equals(1).toArray();
    console.log(savedRounds);
    for (round of savedRounds) {
        ele.appendChild(selectOption(round.id, (round.round + " - " + round.date)));
    }
}

async function loadSavedRound() {
    let select = document.querySelector("#loadRoundSelect");
    let savedID = parseInt(select.value);
    let rows = await db.scores.where("id").equals(savedID).toArray();
    let scores = rows[0]
    console.log(scores);
    generateRoundSheet(scores.round)
    end_arrows = scores.arrowsPerEnd;
    n_ends = scores.ends;
    roundID = scores.id;
    document.querySelector("#roundID").innerHTML = roundID;
    let scoreInputs = document.querySelectorAll(".arrowEntry");
    for (i = 0; i < scoreInputs.length; i++) {
        scoreInputs[i].value = scores.scores[i];
    }
    let noteInput = document.querySelector("#recordNote");
    noteInput.value = scores.note;



}

function selectOption(value, text) {
    let option = document.createElement("option");
    option.value = value;
    option.innerHTML = text;
    return option
}

function hide(id) {
    document.querySelector(id).style.display = "none";
}

function show(id) {
    document.querySelector(id).style.display = "block";
}

function wipe(id) {
    document.querySelector(id).innerHTML = "";
}

async function loadRoundStats(id) {

    let scores = await db.scores.where("id").equals(parseInt(id)).toArray();
    let score = scores[0];
    let stats = document.querySelector("#statsRound");

    //Add Heading for round name

    //Add date

    let table = document.createElement("table");

    stats.appendChild(table);
    table.appendChild(scoreTableHeader(score.arrowsPerEnd))




    showCard("stats");



}

function scoreTableHeader(arrowsPerEnd) {
    let thead = document.createElement("thead");
    let tr = document.createElement("tr");
    thead.appendChild(tr);

    let endLabel = document.createElement("td");
    tr.appendChild(endLabel);
    for (i = 0; i < arrowsPerEnd; i++) {
        let td = document.createElement("td");
        td.innerHTML = (i + 1).toString();
        tr.appendChild(td);
    }

    let hits = document.createElement("td");
    hits.innerHTML = "Hits";
    tr.appendChild(hits);

    let exes = document.createElement("td");
    exes.innerHTML = "Xs";
    tr.appendChild(exes);

    let golds = document.createElement("td");
    golds.innerHTML = "Golds";
    tr.appendChild(golds);

    let tot = document.createElement("td");
    tot.innerHTML = "Total";
    tr.appendChild(tot);

    let running = document.createElement("td");
    running.innerHTML = "Running";
    tr.appendChild(running);

    return thead
}

async function loadScoreSheet() {

    let id = parseInt(document.querySelector("#scoreSheetSelect").value);

    let rounds = await db.scores.where("id").equals(id).toArray();
    let round = rounds[0];

    let statsCard = document.querySelector("#statsRound");
    statsCard.innerHTML = "";


    let h6 = document.createElement("h6")
    h6.innerHTML = round.round + " - " + round.date;
    statsCard.appendChild(h6);

    let note = (round.note == undefined) ? "" : round.note;

    let p = document.createElement("p")
    p.innerHTML = note;
    statsCard.appendChild(p);

    statsCard.appendChild(scorecard(round));



}


function scorecard(score) {
    let scores = score.scores
    let arrowsPerEnd = score.arrowsPerEnd
    let ends = score.ends

    let date = score.date
    let id = score.id
    let round = getRoundByName(score.round)[0];
    console.log(round)
    let passes = round.passes;
    console.log(passes);

    let div = document.createElement("div");

    let table = document.createElement("table")
    table.classList.add("table")
    table.classList.add("table-sm")
    table.classList.add("table-borderd")
    table.style.fontSize = "x-small"

    div.appendChild(table);



    let thead = document.createElement("thead");
    table.appendChild(thead);

    let trhead = document.createElement("tr");
    thead.appendChild(trhead);

    let cols = ["", "ET", "", "ET", "H", "X", "G", "Score", "RT"]

    for (col of cols) {
        let th = document.createElement("th");
        th.innerHTML = col;
        th.scope = "col";

        trhead.appendChild(th);
    }

    let tbody = document.createElement("tbody")
    table.appendChild(tbody);

    let scoreRows = (scores.length / arrowsPerEnd) / 2;
    console.log(scoreRows);
    let scoreTotal = 0;
    let xTotal = 0;
    let hitTotal = 0;
    let goldTotal = 0;
    let a = 0; // Score index
    for (pass of passes) {

        let prow = document.createElement("tr");
        let td = document.createElement("td")
        td.innerHTML = pass.distance + pass.dist_unit;
        prow.appendChild(td);
        tbody.append(prow);

        // Each table row
        for (i = 0; i < pass.n_arrows / (arrowsPerEnd * 2); i++) {
            let scoretr = document.createElement("tr");
            let rowt = 0;
            let rowX = 0;
            let rowGolds = 0;
            let rowHits = 0;



            //Each End
            for (j = 0; j < 2; j++) {
                let endt = 0;
                let endstr = "";

                // Each score
                for (k = 0; k < arrowsPerEnd; k++) {


                    // padding between score entries
                    if (endstr != "") {
                        endstr += " ";
                    }

                    //Arrow score
                    let val = scores[a]
                    if (val == score.note) {
                        a++
                    }


                    //10 if it's an X - TODO can 9s count as X ?
                    switch (val) {
                        case "x":
                        case "X":
                            rowX++
                            xTotal++
                            val = 10
                            break;
                        // 0 if it's an m or M - Could use toUpper oh well
                        case "m":
                        case "M":
                            val = 0
                            break;
                    }
                    //Add to end Total
                    endt += parseInt(val == "" ? 0 : val)
                    //Add to row Total
                    rowt += parseInt(val == "" ? 0 : val)

                    if (val > 0) {
                        rowHits++
                        hitTotal++
                    }
                    if (val >= 9) {
                        rowGolds++
                        goldTotal++
                    }
                    console.log(a)
                    console.log(val)

                    endstr += scores[a].toUpperCase();
                    scoreTotal += parseInt(val);

                    // Update score index
                    a++




                }
                for (each of [endstr, endt]) {
                    let td = document.createElement("td");
                    td.innerHTML = each;
                    scoretr.appendChild(td);
                }


            }

            //After two ends have processed
            for (each of [rowHits, rowX, rowGolds, rowt, scoreTotal]) {
                let td = document.createElement("td");
                td.innerHTML = each;
                scoretr.appendChild(td);
            }

            tbody.appendChild(scoretr);
        }





    }

    //Add final scores

    let totals = [{ tag: "Total Hits: ", value: hitTotal },
    { tag: "Total Xs: ", value: xTotal },
    { tag: "Total Golds: ", value: goldTotal }]

    let pstring = ""

    for (total of totals) {
        pstring = total.tag + total.value;

        let p = document.createElement("div");

        p.innerHTML = pstring;
        div.appendChild(p)
    }



    let h6 = document.createElement("h6");
    h6.innerHTML = "Final Score : " + scoreTotal;
    div.appendChild(h6);


    return div;





}
//Create scorecard assuming score from array.



/*

                    <table class="table table-sm table-bordered" style="font-size: xx-small;">
                        <h6 id="scorecardTitle">Warwick 10/04/2024</h6>
                        <p id="font-size: small;">Tom Bosher Personal Round</p>
                        <thead>
                            <tr>
                                <th scope="col"></th>
                                <th scope="col">E/T</th>
                                <th scope="col"></th>
                                <th scope="col">E/T</th>
                                <th scope="col">H</th>
                                <th scope="col">X</th>
                                <th scope="col">G</th>
                                <th scope="col">Score</th>
                                <th scope="col">R/T</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>10 10 10 10 10 10</td>
                                <td>54</td>
                                <td>10 10 10 10 10 10</td>
                                <td>54</td>
                                <td>12</td>
                                <td>12</td>
                                <td>12</td>
                                <td>108</td>
                                <td>108</td>
                            </tr>
                        </tbody>
                    </table>

*/

