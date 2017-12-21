/*
 * tools4chat
 * Copyright(c) 2017, J. García <u0x004a at gmail.com>
 * This file is distributed under the GNU General Public License, version 2
 */

var T4CRecordsHelper = (function(){
	var rgcount      = 0;
	var sample       = "Sample:";
	var groupSet     = [];
	var groupViewSet = [];
	var svgIconSet   = {
		'copy'    : '<img class="icon" src="./assets/copy.svg" alt="Copy">',
		'new'     : '<img class="icon" src="./assets/new.svg" alt="New">',
		'restore' : '<img class="icon" src="./assets/restore.svg" alt="Restore">',
		'prev'    : '<img class="icon" src="./assets/prev.svg" alt="Previous">',
		'next'    : '<img class="icon" src="./assets/next.svg" alt="Next">'
	};

	/* 
	 * Record prototype 
	 * associatedID: This record contents are associated to it.
	 * record: The contents of the record.
	 * savedAt: The date it was saved at.
	 */
	// Start
	//------------------------------------------------------------------------
	function Record (associatedID, record ){
		this.associatedID = associatedID;
		this.savedAt      = Date.now();
		this.record       = record;
	}

	// Set the associated ID for the record
	Record.prototype.setAssociatedID = function (aid){
		this.associatedID = aid;
	}

	// Set the contents of the record
	Record.prototype.setRecord = function (record){
		this.record  = record;
		this.savedAt = Date.now();
	}
	// End Record Prototype
	//------------------------------------------------------------------------

	/*
	 * RecordsGroup Prototype
	 * gid: The group ID 
	 * displayedIndex: The index of the displayed record
	 * recordSet: The set of records in this group
	 * viewInfo: Info about the position in document at the time of display
	 */
	// Start
	//------------------------------------------------------------------------
	function  RecordsGroup (gid){
		this.gid            = gid;
		this.displayedIndex = 0;
		this.recordSet      = [];
        this.viewInfo       = {
                                x      : 0,
                                y      : 0,
                                width  : 0,
                                height : 0
                              };
	}
	// Add a record to this group
	RecordsGroup.prototype.addRecord = function(record){
		this.recordSet.push(record)
	}

	// Save the information of the view currently displayed
	RecordsGroup.prototype.saveViewInfo= function(){
		var displayedDiv = document.getElementById('record-box-'+ this.gid);
		if (displayedDiv != null){
			var bb               = displayedDiv.getBoundingClientRect();
			this.viewInfo.x      = bb.left;
			this.viewInfo.y      = bb.top;
			this.viewInfo.width  = bb.width;
			this.viewInfo.height = bb.height;
			var ts               = [
				"Group ", this.gid,
				" position(", this.viewInfo.x, ",", this.viewInfo.y, ")",
				" dimensions(", this.viewInfo.width, ",", this.viewInfo.height, ")"
			].join("");
			console.log(ts);
		}
	} 
	// End RecordsGroup
	//------------------------------------------------------------------------

     /*
	  * RecordsGroupView prototype 
      * groupID: The group id corresponding to this view.
      * divRecordBox: The <div> that contains all the elements.
      * divRecordHeader: The <div> the header elements: idLabel, idInput, posBox.
      * idLabel: Simple label that says id.
      * idInput: The <input> for the id.
      * posBox: The displayed index against the amount of records in the group.
      * recordTextArea: <textarea> containing the sample by default.
      * divControlBox: Contains the buttons and  the date.
      * copyBtn: Button to copy the contents in recordTextArea.
      * newBtn: Create a new Record or return to the latest if it is unchanged.
      * nextBtn: Go to the next Record available.
      * prevBtn: Go to the previous Record available.
      * statusBox: <div> containing the date.
      * saveTimeBox: <div> containing the hour this record was last saved at.
      */
	// Start
	//------------------------------------------------------------------------
	function RecordGroupView(groupID){
		this.groupID = groupID;
		// create box
		this.divRecordBox = document.createElement('div');
		this.divRecordBox.setAttribute('id','record-box-' + groupID);
		this.divRecordBox.setAttribute('class','record-grp');
		this.divRecordBox.setAttribute('onclick', 'T4CRecordsHelper.bringToFront(' + groupID +')');

		// create header 
		this.divRecordHeader = document.createElement('div');
		this.divRecordHeader.setAttribute('class','record-header');
		this.idLabel = document.createElement('label');
		this.idLabel.setAttribute('class','id-label');
		this.idLabel.innerText = (groupID + 1 ) + ' ID';
		this.idInput = document.createElement('input');
		this.idInput.setAttribute('id','id-input-'+groupID);
		this.idInput.setAttribute('class','id-input');
		this.idInput.setAttribute('oninput','T4CRecordsHelper.checkIdInput('+groupID+')');
		this.idInput.setAttribute('placeholder','Enter ID');
		this.idLabel.setAttribute('for', 'id-input-'+groupID);
		this.divRecordHeader.appendChild(this.idLabel);
		this.divRecordHeader.appendChild(this.idInput);
		this.posBox = document.createElement('div');
		this.posBox.setAttribute('class','position-box');
		this.posBox.setAttribute('id','pos-box-' + groupID);
		this.posBox.innerHTML = "1/1";
		this.divRecordHeader.appendChild(this.posBox);
		this.divRecordBox.appendChild(this.divRecordHeader);

		// create textarea
		this.recordTextArea = document.createElement('textarea');
		this.recordTextArea.setAttribute('id','record-ta-' + groupID);
		this.recordTextArea.setAttribute('class','record-content');
		this.recordTextArea.value = sample;
		this.divRecordBox.appendChild(this.recordTextArea);


		// create record controls
		this.divControlBox = document.createElement('div');
		this.divControlBox.setAttribute('class','record-control');
		// add buttons
		this.copyBtn = document.createElement('button');
		this.copyBtn.setAttribute('class','control');
		this.copyBtn.setAttribute('title','Copy');
		this.copyBtn.setAttribute('onclick', 'T4CRecordsHelper.copyToClipboard(' + groupID +')');
		this.copyBtn.innerHTML = svgIconSet['copy'];
		this.divControlBox.appendChild(this.copyBtn);

		this.newBtn = document.createElement('button');
		this.newBtn.setAttribute('class','control');
		this.newBtn.setAttribute('title','New');
		this.newBtn.setAttribute('onclick', 'T4CRecordsHelper.newRecord(' + groupID +')');
		this.newBtn.innerHTML = svgIconSet['new'];
		this.divControlBox.appendChild(this.newBtn);

		this.prevBtn = document.createElement('button');
		this.prevBtn.setAttribute('class','control');
		this.prevBtn.setAttribute('title','Prev');
		this.prevBtn.setAttribute('onclick', 'T4CRecordsHelper.prev(' + groupID +')');
		this.prevBtn.innerHTML = svgIconSet['prev'];
		this.divControlBox.appendChild(this.prevBtn);

		this.nextBtn = document.createElement('button');
		this.nextBtn.setAttribute('class','control');
		this.nextBtn.setAttribute('title','Next');
		this.nextBtn.setAttribute('onclick', 'T4CRecordsHelper.next(' + groupID +')');
		this.nextBtn.innerHTML = svgIconSet['next'];
		this.divControlBox.appendChild(this.nextBtn);

		// status div
		this.statusBox = document.createElement('div');
		this.statusBox.setAttribute('class', 'rg-status-box');

		// add saved date
		this.saveTimeBox = document.createElement('div');
		this.saveTimeBox.setAttribute('class', 'saved-date-box');
		this.saveTimeBox.setAttribute('id', 'sv-date-'+ groupID);
		this.saveTimeBox.innerHTML= "<p>No date</p>";
		this.statusBox.appendChild(this.saveTimeBox);

		this.divControlBox.appendChild(this.statusBox);

		// add controls
		this.divRecordBox.appendChild(this.divControlBox);
	}

	// Update displayed record in document
	RecordGroupView.prototype.refreshDisplayedRecord = function() {
		var gs              = groupSet[this.groupID];
		indocTextArea       = document.getElementById('record-ta-'+ this.groupID);
		indocTextArea.value = gs.recordSet[gs.displayedIndex].record;
		indocIdInput        = document.getElementById('id-input-'+ this.groupID);
		indocIdInput.value  = gs.recordSet[gs.displayedIndex].associatedID ;
		indocDate			= document.getElementById('sv-date-'+ this.groupID);
		indocPos			= document.getElementById('pos-box-'+ this.groupID);

		// set date
		var d = new Date(gs.recordSet[gs.displayedIndex].savedAt);
		//var ds = [d.getHours(),":",d.getMinutes(),":",d.getSeconds()].join("");
		var ds = d.toLocaleTimeString();
		indocDate.innerHTML = '<p> <i>'+ds+'<i></p>'
		indocPos.innerText	= (gs.displayedIndex + 1)+'/'+ gs.recordSet.length;
		// set color of id field
		checkIdInput(this.groupID);
	}

	// Returns the <div> divRecordBox that contains all the elemnts
	RecordGroupView.prototype.getView = function() {
		return this.divRecordBox;
	}

	// Place this view in doc below the group with ID rgID
	RecordGroupView.prototype.placeBellow = function(rgID){
		var refid = 'record-box-' + rgID;
		var boxid = 'record-box-' + this.groupID;
		var rec   = document.getElementById(refid).getBoundingClientRect();
		var left  = document.getElementById(refid).style.left;
		document.getElementById(boxid).style.top  = rec.bottom + 4;
		document.getElementById(boxid).style.left = left;
	}
	// End RecordGroupView Prototype
	//------------------------------------------------------------------------

	// Creates new RecordGroup and corresponding RecordGroupView
	function newRecordsGroup(){
		groupSet[rgcount] = new  RecordsGroup(rgcount);
		var nr = new Record( "" , sample );
		groupSet[rgcount].addRecord(nr);
		groupSet[rgcount].displayedIndex = 0;
		groupViewSet[rgcount] = new RecordGroupView(rgcount);
		document.getElementById('content').appendChild(groupViewSet[rgcount].getView());

		groupID = rgcount;
		$(function(){
			grpBoxID =  '#record-box-' + groupID;
			//taID =  '#record-ta-' + groupID;
			$( grpBoxID ).resizable(
				{ 
					handles   : "se",
					minHeight : 225,
					minWidth  : 225
				}
			);
			//$( taID ).resizable({ alsoResize: grpBoxID });
			$( grpBoxID ).draggable();
		});
		rgcount++;
	}

	// Bring the <div> that contains group id rgID to front, z-index = 1;
	function bringToFront(rgID){
		for (var i = 0  ; i < groupSet.length ; i++){
			document.getElementById('record-box-'+ i).style.zIndex = (rgID == i)? 1 : 0;
		}
	}

	// Copy group rgID contents to clipboard
	function copyToClipboard(rgID){
		saveDiplayedRecord(rgID);
		id = 'record-ta-'+ rgID;
		ta = document.getElementById(id); //text area
		ta.select();
		document.execCommand("Copy");
		console.log("Copied record " + rgID  );
	}

	// add a new Record to rgID.
	function newRecord(rgID){
		var rs = groupSet[rgID].recordSet;
		var gs = groupSet[rgID];
		var lastIndex = rs.length -1;
		saveDiplayedRecord(rgID)
		gs.displayedIndex = lastIndex;
		if (rs[lastIndex].record.length != sample.length){
			gs.displayedIndex += 1;
			var nr = new Record( "" , sample );
			gs.addRecord(nr);
		}
		groupViewSet[rgID].refreshDisplayedRecord();
	}

	// Save the record displayed  if it was changed
	function saveDiplayedRecord(rgID){
		var rs  = groupSet[rgID].recordSet;
		var gs  = groupSet[rgID];
		var ta      = document.getElementById('record-ta-'+ rgID); // textarea
		var idInput = document.getElementById('id-input-'+ rgID); // textarea
		if ( ta.value.length != rs[gs.displayedIndex].record.length){ 
			rs[gs.displayedIndex].setRecord(ta.value);
		}
		if(idInput.value.length > 0){
			rs[gs.displayedIndex].setAssociatedID(idInput.value);
		}
	}

	// Save the sample and change it in the groups last created record,
	// if it hasn't been modified.
	function saveSample(){
		ta        = document.getElementById("sample-ta");
		oldSample = sample;
		sample    = ta.value;
		for (var i = 0, len = groupSet.length; i < len; i++) {
			saveDiplayedRecord(i);
			var rs = groupSet[i].recordSet;
			var li = rs.length - 1;
			if (rs[li].record.length == oldSample.length){
				rs[li].record = sample;
			}
			groupViewSet[i].refreshDisplayedRecord();
		}
	}
	
	// Move the View to the next record available
	function next(rgID){
		saveDiplayedRecord(rgID);
		var rs = groupSet[rgID].recordSet;
		groupSet[rgID].displayedIndex += 1;
		if(  groupSet[rgID].displayedIndex < rs.length){
			groupViewSet[rgID].refreshDisplayedRecord();
		} else {
			groupSet[rgID].displayedIndex = rs.length -1;
		}
		groupViewSet[rgID].refreshDisplayedRecord();
	}

	// Move the View to the previous record available
	function prev(rgID){
		saveDiplayedRecord(rgID);
		var rs = groupSet[rgID].recordSet;
		groupSet[rgID].displayedIndex--;
		if(groupSet[rgID].displayedIndex > -1){
			groupViewSet[rgID].refreshDisplayedRecord();
		} else {
			groupSet[rgID].displayedIndex = 0;
		}
		groupViewSet[rgID].refreshDisplayedRecord();
	}

	// check the input for the group rgID
	function checkIdInput(rgID){
		idInput = document.getElementById('id-input-'+ rgID);
		idInput.style.background = (idInput.value == "")?'tomato':'palegreen';
	}
	
	// initialize the first 2 views
	function initialize(){
		console.log("Starting Records");
		newRecordsGroup();
		newRecordsGroup();
		groupViewSet[1].placeBellow(0);
	}

	// Returned object T4CRecordsHelper
	return {
		// vars
		rgcount      : rgcount,
		sample       : sample,
		groupSet     : groupSet,
		groupViewSet : groupViewSet,
		svgIconSet   : svgIconSet,

        // functions
        newRecordsGroup: newRecordsGroup,
        bringToFront: bringToFront,
        copyToClipboard: copyToClipboard,
        newRecord: newRecord,
        saveDiplayedRecord: saveDiplayedRecord,
        saveSample: saveSample,
        saveSample: saveSample,
        next: next,
        prev: prev,
        checkIdInput: checkIdInput,
        initialize: initialize
	}
})();
window.onload = T4CRecordsHelper.initialize;
// vim:set sw=4 ts=4 sts=2 noet:
