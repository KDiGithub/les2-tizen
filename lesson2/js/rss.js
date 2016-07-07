webdb = openDatabase('mydb', '1.0', 'Test DB', 2 * 1024 * 1024);
webdb.transaction(function (tx){
	tx.executeSql('CREATE TABLE IF NOT EXISTS RSS4 (id integer primary key autoincrement, title text, description text, url_img text)', [], null, null);
});

function getFeed(){
	var FEED_URL = "http://www.3dnews.ru/news/rss/";
	var width = screen.width;
	
	$(document).ready(function(){
		$.ajax({
			type: "GET",
			url: FEED_URL,
			dataType: "xml",
			error: getStorage(function(res){
				for (var field in res){
					for(var fieldValue in (value = res[field]))
						{
							switch(fieldValue){
							case 'title':
								var title = value[fieldValue];
								break;
							case 'description':
								var description = value[fieldValue];
								break;
							case 'url_img':
								var url_img = value[fiedlValue];
								break;
							}
						}
					
					$('#rssContent').append('<div class="feed">' +
							'<div class="images"><image src='+ url_img +' style="width: 100vw" > </image></div>' +
							'<div class="title" style="font-weight: bold; "> '+ title + '</div>' +
							'<div class="description" style="font-size:12px"> '+ description + '</div></div>');
				}
			}),
			success: xmlParser
		});
	});
	
	function xmlParser(xml){
		clearStore();
		
		$(xml).find("item").each(function(){
			var i=0;
			var arr=[];
			var url_img = $(this).find("enclosure").attr('url');
			$('#rssContent').append('<div class="feed">' +
					'<div class="images"><image src='+ url_img +' style="width: 100vw" > </image></div>' +
					'<div class="title" style="font-weight: bold; "> '+ $(this).find("title").text() + '</div>' +
					'<div class="description" style="font-size:12px"> '+ $(this).find("description").text() + '</div></div>');
			
			arr[i]= {url_img: $(this).find("enclosure").attr('url'), title: $(this).find("title").text(), description: $(this).find("description").text()};
			setData(arr[i]);
			
			var temporary_array_title = "";
			temporary_array_title =  arr[i].title;
			var temporary_array_url_img= "";
			temporary_array_url_img = arr[i].url_img;
			var temporary_array_description = "";
			temporary_array_description =  arr[i].description;
	
			webdb.transaction(function (tx) {  		
				tx.executeSql('INSERT INTO RSS4 (title, description, url_img) VALUES (?,?,?)', [temporary_array_title, temporary_array_description, temporary_array_url_img], null, function(e){					
					console.log('Error');
				});
			});
			i++
		});
	}
}

var substring = "";
function searchData(substring){
	//substring=document.getElementsById("searchh").val();
	
	console.log(substring);
	var result = [];
	webdb.transaction(function(tx){
			tx.executeSql("SELECT title FROM RSS4 WHERE title LIKE '%" + substring + "%'", [], function(tx, result){
				var tab = [];
				for(var j = 0; j <result.rows.length; j++)
				{
					$("#searchRes").append(j+ ") " + result.rows.item(j)['title'] +"<br>");
					//alert(result.rows.item(j)['title']);
					//alert(result.length);
				}
				
			}, function(e){
				console.log('Error of select');
			});
	});
};

//WebSQL

function clearStore(){

	webdb.transaction(function (tx) {
		  tx.executeSql('DROP TABLE RSS4');
		});
	
	webdb.transaction(function (tx){
		tx.executeSql('CREATE TABLE IF NOT EXISTS RSS4 (id integer primary key autoincrement, title text, description text, url_img text)', [], null, null);
	});
}

function prepareDatabase(ready, error) {
	  return openDatabase('documents', '1.0', 'Offline document storage', 5*1024*1024, function (db) {
	    db.changeVersion('', '1.0', function (t) {
	      t.executeSql('CREATE TABLE docids (id, name)');
	    }, error);
	  });
	}

	function showDocCount(db, span) {
	  db.readTransaction(function (t) {
	    t.executeSql('SELECT COUNT(*) AS c FROM docids', [], function (t, r) {
	      span.textContent = r.rows[0].c;
	    }, function (t, e) {
	      // couldn't read database
	      span.textContent = '(unknown: ' + e.message + ')';
	    });
	  });
	}

	prepareDatabase(function(db) {
	  // got database
	  var span = document.getElementById('doc-count');
	  showDocCount(db, span);
	}, function (e) {
	  // error getting database
	  alert(e.message);
	});

//IndexedDB	
	
var indexedDB 	  = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB,
IDBTransaction  = window.IDBTransaction || window.webkitIDBTransaction || window.msIDBTransaction,
baseName 	  = "filesBase",
storeName 	  = "filesStore";


function logerr(err){ 
	console.log(err);
}

function connectDB(f){ 
	var request = indexedDB.open(baseName, 1); 
	request.onerror = logerr;
	request.onsuccess = function(){
		f(request.result);
	}
	request.onupgradeneeded = function(e){ 
		var objectStore = e.currentTarget.result.createObjectStore(storeName, { autoIncrement: true });
		connectDB(f);
	}
}

function getData(key, f){ 
	connectDB(function(db){
		var request = db.transaction([storeName], "readonly").objectStore(storeName).get(key);
		request.onerror = logerr;
		request.onsuccess = function(){
			f(request.result ? request.result : -1);
		}
	});
}

function getStorage(f){ 
	connectDB(function(db){
		var rows = [],
			store = db.transaction([storeName], "readonly").objectStore(storeName);

		if(store.mozGetAll)
			store.mozGetAll().onsuccess = function(e){
				f(e.target.result);
			};
		else
			store.openCursor().onsuccess = function(e) {
				var cursor = e.target.result;
				if(cursor){
					rows.push(cursor.value);
					cursor.continue();
				}
				else {
					f(rows);
				}
			};
	});
}

function setData(obj){ 
	connectDB(function(db){
		var request = db.transaction([storeName], "readwrite").objectStore(storeName).add(obj);
		request.onerror = logerr;
		request.onsuccess = function(){
			return request.result;
		}
	});
}

function delData(key){ 
	connectDB(function(db){
		var request = db.transaction([storeName], "readwrite").objectStore(storeName).delete(key);
		request.onerror = logerr;
		request.onsuccess = function(){
			console.log("File delete from DB:", file);
		}
	});
}

function clearStorage(){ 
	connectDB(function(db){
		var request = db.transaction([storeName], "readwrite").objectStore(storeName).clear();;
		request.onerror = logerr;
		request.onsuccess = function(){
			console.log("Clear");
		}
	});
}



