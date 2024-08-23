metricDistances = ["30m", "40m", "50m", "60m"];
imperialDistances = ["20yd", "30yd", "40yd", "50yd", "60yd", "70yd", "80yd", "90yd", "100yd", "110yd"];

rounds = [
    {
        name: "Warwick",
        distance1: "60yd",
        distance2: "50yd",
        distance3: "None",
        distance1Ends: 4,
        distance2Ends: 4,
        distance3Ends: 0,
    }
]

const db = new Dexie("ArcheryBuddy");
db.version(1).stores({
    sightMarks: '++id, distance',
    scores: '++id, round'
});


$(document).ready(function () {
    populateSightMarkSelect()
    populateRecordRoundSelect()
    populateSightMarkTable()
    populateIndividualMarks()
    showCard("recordRound")
});

//Add all distances to the addSightMarkSelect Select as an option
function populateSightMarkSelect() {
    processList(metricDistances)
    processList(imperialDistances)
    function processList(list) {
        for (distance of list) {
            newElement = document.createElement("option");
            newElement.value = distance;
            newElement.innerHTML = distance;
            document.querySelector("#addSightMarkSelect").appendChild(newElement);
        }
    }
}

//Generate Record Table Based on recordRoundSelect
function populateRecordRoundSelect() {
    for (round of rounds) {
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
    processList(metricDistances);
    processList(imperialDistances);

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
            tag.innerHTML = distance;
            let value = document.createElement("td");
            value.innerHTML = dbrow[last]["mark"]
            let date = document.createElement("td");
            date.innerHTML = dbrow[last]["date"]
            newRow.appendChild(tag);
            newRow.appendChild(value);
            newRow.appendChild(date);
            smt.appendChild(newRow);
        }
    }
}

//Populate Individual Marks Tables
function populateIndividualMarks() {
    let parent = document.querySelector("#individualMarks")
    parent.innerHTML = "";
    processList(metricDistances)
    processList(imperialDistances)
    function processList(list) {
        for (distance of list) {

            //Create Card
            let card = document.createElement("div");
            card.classList.add("card")
            card.classList.add("p-3")
            parent.appendChild(card);

            //Add heading
            let ele = document.createElement("h6");
            ele.innerHTML = distance;
            card.appendChild(ele);

            //Create table
            let t = document.createElement("table");
            card.appendChild(t);
            t.classList.add("table");
            t.classList.add("table-sm");

            //Create Headers
            let thead = document.createElement("thead");
            t.appendChild(thead);
            let th1 = document.createElement("th");
            th1.innerHTML = "Sight Mark";
            thead.appendChild(th1);
            let th2 = document.createElement("th");
            th2.innerHTML = "Date";
            thead.appendChild(th2);

            //Create Body - TBD
            let tbody = document.createElement("tbody");
            t.append(tbody);

            parent.appendChild(document.createElement("br"));




        }

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
    let time = new Date().toDateString();
    db.sightMarks.put({ "distance": dist, "mark": mark, "date": time })
    populateSightMarkTable();
}