var QUERY = "";

function setQuery(q) {
	QUERY = q;
	bookSearcher.searchLibGen_ = 'http://gen.lib.rus.ec/search.php?' +
      'req='+ QUERY +'&' +
	  'open=0&view=simple&column=def';
}




var bookSearcher = {
   
  searchLibGen_: '',
	
  getJSONResults: function() {
    var req = new XMLHttpRequest();
    req.open("GET", this.searchLibGen_, true);
    req.onload = this.logResults_.bind(this);
    req.send(null);
  },

  logResults_: function (e) {
	var tab = e.target.responseText,
		rHtml = $.parseHTML(tab);
	var key, table;
	for(key in rHtml) {
		if(rHtml[key].nodeName == "TABLE") {
			if($(rHtml[key]).attr('class') == "c"){
				table = $(rHtml[key])[0];
			}
		}
	}
	var bookObjs = this.tableToJSON_(table);
	this.crapOutHtml_(bookObjs);
  },
  crapOutHtml_: function(books) {
	var booksLen = books.length;
	for (i=0; i<booksLen; i++) {
		book = books[i];
		console.log(book);
		var trEl = document.createElement("tr");
		var bookCol = document.createElement("td"),
			dlCol = document.createElement("td");
		urls = book.mirrors;
		links = [];
		$.each(urls, function(index, value){			
			currentMir = document.createElement('a');
			currentMir.href = value;
			currentMir.innerHTML = "["+(index+1)+"] ";
			$(currentMir).bind("click", function(){
				chrome.tabs.create({url: value});
			});
			links.push(currentMir);
		});
		
		$(bookCol).append("<b>["+book.extension+"]</b> " + book.title + "<br><i>"+book.authors+"</i>");
		$(dlCol).append(links);
		
		$(trEl).append(bookCol).append(dlCol);
		
		$("#resultsTable").append(trEl);
		
	}
  },

  tableToJSON_: function(table) {
	var data = [];
	var $rows = $(table).find("tr").not(":first");
	
	for (i=0; i<$rows.length; i++){
		var $row = $($rows)[i];
		var $cols = $($row).find("td");
		entry = new Object();
		entry.mirrors = [];
		for (j=0;j<$cols.length; j++){
			switch(j) {
				case 1:
					entry.authors = $cols[j].innerText;
					break;
				case 2:
					var titStr = $cols[j].innerText;
					entry.title = titStr.split("\n")[0];
					break;
				case 4:
					entry.year = $cols[j].innerText;
					break;
				case 8:
					entry.extension = $cols[j].innerText;
					break;
				case 9:
				case 10:
				case 11:
				case 12:
					entry.mirrors.push($cols[j].innerHTML);
					break;
			}
		}
		newMirrors = [];
		
		for (k=1; k<entry.mirrors.length; k++){
			mir = entry.mirrors[k];
			mir = $(mir).attr("href");
			mir = mir.replace("../", "http://gen.lib.rus.ec/");
			newMirrors.push(mir);
		}	
		entry.mirrors = newMirrors;
		data.push(entry);
	}
	return data;
  }
};

$(function(){
	$("#resultsTable").hide();
	$("hr:first").hide();
	$('#searchButton').click(function(){
		var inpVal = $('#searchInput').val().trim();
		if (inpVal.length > 3){
			$("#resultsTable tr:gt(0)").remove();
			inpVal = encodeURIComponent(inpVal);
			setQuery(inpVal);
			bookSearcher.getJSONResults();
			$("hr:first").show();
			$("#resultsTable").show();
		} else {
			$("#searchInput").val("");
			alert("Searches must be at least 4 characters long.");
		}
	});
});


