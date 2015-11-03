/*
	Copyright (c) 2015, Zhaofeng Li
	All rights reserved.

	Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

	1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

	2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

	3. Neither the name of the copyright holder nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

	THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

// ==UserScript==
// @name agent-stats-filter
// @namespace https://zhaofeng.li
// @version 3
// @description This script adds filtering capabilities to Agent Stats.
// @match https://www.agent-stats.com/groups.php*
// @require https://ajax.googleapis.com/ajax/libs/jquery/1.11.0/jquery.min.js
// ==/UserScript==

var filterui = "\
<fieldset>\
	<legend>Filter</legend>\
	<label>\
		<span>\
			Only show players with\
			<select id='filter-basic-column'>\
			</select>\
			<select id='filter-basic-compare'>\
				<option value='11' selected=''>&gt;=</option>\
				<option value='01'>&lt;=</option>\
				<option value='10'>&gt;</option>\
				<option value='00'>&lt;</option>\
			</select>\
			<input id='filter-basic-value'></input>\
			<button id='filter-basic-launch'>Go</button>\
		</span>\
	</label>\
	<label>\
		<span>\
			Hide players who haven't uploaded data in the last\
			<select id='filter-date-threshold'>\
				<option value='86400' selected=''>24 hours</option>\
				<option value='604800'>week</option>\
				<option value='2628000'>month</option>\
				<option value='15552000'>6 months</option>\
			</select>\
			<button id='filter-date-launch'>Go</button>\
		</span>\
	</label>\
	<button id='filter-reset'>Reset filters</button><br/>\
	<small>Note: You can apply multiple filters at once. When filtering by faction, choose &gt; or &gt;= to show Resistance agents only, and vice versa.</small>\
</fieldset>\
";

// `column`: Which column to filter by, starting from 0 (the ranking column). For example, if you want to filter by AP, set this to 3.
// If you are filtering by last submission date (column -1 or the last column), use a Unix Epoch for `value`
// If you are filtering by faction (column 1), `true` in `greaterthan` will match Resistances and vice versa
//                    int     bool     bool          int
function filterStats( column, greater, includeequal, value ) {
	$( "#group tbody tr" ).each( function() {
		// this = <tr>
		if ( !$( this ).is( ":visible" ) ) {
			return; // Next!
		}
		var element = $( this ).children().get( column );
		var data = $( element ).text().replace(/[\u200B-\u200D\uFEFF]/g, '');
		if ( column === -1 || column === $( this ).children().length - 1 ) { // last submission date
			data = data.split( "/" );
			date = new Date( 0 );
			date.setFullYear( parseInt( data[2] ) );
			date.setMonth( parseInt( data[0] ) - 1 );
			date.setDate( parseInt( data[1] ) );
			data = date.getTime();
		} else if ( column === 1 ) { // faction
			if ( $( element ).hasClass( "res" ) != greater ) {
				$( this ).hide();
			}
			return; // Next!
		} else { // numerical data
			if ( data != "-" ) {
				data = parseInt( data.replace( /,/g, "" ) ); // convert to int
			} else {
				data = 0;
			}
		}
		if (
			false === ( greater && ( data > value ) ) &&
			false === ( includeequal && ( data === value ) )
		) {
			$( this ).hide();
		}
	} );
	rebuildRankings();
}

function resetFilter() {
	$("#group tbody tr").show();
	rebuildRankings();
}

function rebuildRankings() {
	var ranking = 1;
	$( "#group tbody tr" ).each( function() {
		// this = <tr>
		if ( !$( this ).is( ":visible" ) ) {
			return; // Next!
		} else {
			var e = $( this ).children().get( 0 );
			$( e ).html( ranking++ );
		}
	} );
}

function initFilter() {
	if ( $( "#group" ).length ) {
		$( "fieldset:first" ).after( filterui );
		$( "#filter-basic-launch" ).click( function( e ) {
			e.preventDefault();
			var compare = parseInt( $( "#filter-basic-compare" ).val() );
			var greater = parseInt( compare / 10 );
			var includeequal = parseInt( compare % 10 );
			var column = parseInt( $( "#filter-basic-column" ).val() );
			var value = parseInt( $( "#filter-basic-value" ).val() );
			filterStats( column, greater, includeequal, value );
		} );
		$( "#filter-date-launch" ).click( function( e ) {
			e.preventDefault();
			var column = -1;
			var greater = true;
			var includeequal = true;
			var value = Date.now() - parseInt( $( "#filter-date-threshold" ).val() ) * 1000;
			filterStats( column, greater, includeequal, value );
		} );
		$( "#filter-reset" ).click( function( e ) {
			e.preventDefault();
			resetFilter();
		} );
		$( "#group thead td" ).each( function() {
			var name = "";
			if ( 0 === $( this ).index() ) {
				name = "Ranking";
			} else if ( 1 === $( this ).index() ) {
				name = "Faction";
			} else {
				name = $( this ).text();
			}
			$( "#filter-basic-column" ).append(
				$( "<option>" ).attr( "value", $( this ).index() ).html( name )
			);
		} );
	}
}

// Kanged from http://stackoverflow.com/a/10113434
(function() {
	var script = document.createElement( "script" );
	script.type = "text/javascript";
	script.src = "https://ajax.googleapis.com/ajax/libs/jquery/1.11.0/jquery.min.js";
	document.getElementsByTagName( "head" )[0].appendChild( script );

	// Poll for jQuery to come into existance
	var checkReady = function( callback ) {
	 	if (window.jQuery) {
			callback( jQuery );
		} else {
			window.setTimeout( function() { checkReady(callback); }, 100 );
		}
	};
	checkReady( initFilter );
})();
