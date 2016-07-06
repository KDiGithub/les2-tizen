var indexedDB 	  = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB,
IDBTransaction  = window.IDBTransaction || window.webkitIDBTransaction || window.msIDBTransaction,
baseName 	  = "filesBase",
storeName 	  = "filesStore";
db = openDatabase(baseName, "0.1", "Articles.", 200000);



function getFeed()
{
	var FEED_URL ="http://www.3dnews.ru/news/rss/";
	$(document).ready(function(){
		$.ajax({
			type:"GET",
			url: FEED_URL,
			dataType: "xml",
			error: getStorage(function(res){
				
				for(var field in res)
				{
					for(var fieldValue in (value=res[field]))
					{
						switch(fieldValue)
						{
							case 'title':
								var title=value[fieldValue];
							break;
							case 'description':
								var description=value[fieldValue];
							break;
							case 'url_img':
								var url_img=value[fieldValue];
							break;
						}
					}
					$('#rssContent').append('<div class="feed">'+
							'<div class="images"> <image src='+ url_img +' style="width: 100vw"> </image> </div>'+
							'<div class="title" style="font-weight:bold"> '+ title +': </div>'+
							'<div class="description" style="font-size:12pt" > '+ description +'</div><br></div>');
					
				}
			}),
			success: xmlParser
		})
	});
	
	function xmlParser(xml)
	{
		var i=0, arr=[];
		clearStorage();
		
		$(xml).find("item").each(function(){
			var url_img = $(this).find("enclosure").attr('url');
			$('#rssContent').append('<div class="feed">'+
					'<div class="images"> <image src='+ url_img +' style="width: 100vw"> </image> </div>'+
					'<div class="title" style="font-weight:bold"> '+ $(this).find("title").text() +': </div>'+
					'<div class="description" style="font-size:12pt" > '+ $(this).find("description").text() +'</div><br></div>');

			arr[i]={title: $(this).find("title").text(), description: $(this).find("description").text(), image:$(this).find("enclosure").attr('url')};  
			setData(arr[i].title, arr[i].description, arr[i].image);
			i++;
		
		});
		
	}
	
}





function logerr(err){
	console.log(err);
}

function connectDB(f){
	/*var request = indexedDB.open(baseName, 1);
	request.onerror = logerr;
	request.onsuccess = function(){
		f(request.result);
	}
	request.onupgradeneeded = function(e){
		var objectStore = e.currentTarget.result.createObjectStore(storeName, { autoIncrement: true });
		connectDB(f);
	}*/
	
	db = openDatabase(baseName, "0.1", "Articles.", 200000);
	if(!db){alert("Failed to connect to database.");}
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
	/*connectDB(function(db){
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
	});*/
	
	db.transaction(function (tx) {
		   tx.executeSql('SELECT * FROM '+storeName, [], function (tx,res) {
			  
			   while (tx.next()) {
				   
				   var title = res.getString(3);
				   var description = res.getString(4);
				   var image = res.getString(5);
				 }
			
		   });
		});

}

/*function setData(obj){
	connectDB(function(db){
		var request = db.transaction([storeName], "readwrite").objectStore(storeName).add(obj);
		request.onerror = logerr;
		request.onsuccess = function(){
			return request.result;
		}
	});
}*/

function setData(title_, description_, image_){
	
	db.transaction(function(tx){
		tx.executeSql('CREATE TABLE IF NOT EXISTS ' + storeName + ' (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, description TEXT, image TEXT)',[], null,null);
		
		tx.executeSql('INSERT INTO '+ storeName +'(title, description, image) VALUES (?,?,?)', [title_,description_,image_],null,function(e){
			console.log('Error');
		});
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
	
	/*connectDB(function(db){
		var request = db.transaction([storeName], "readwrite").objectStore(storeName).clear();;
		request.onerror = logerr;
		request.onsuccess = function(){
			console.log("Clear");
		}
	});*/

	db.transaction(function (tx) {
		  tx.executeSql('DROP TABLE '+storeName);
		});
}

