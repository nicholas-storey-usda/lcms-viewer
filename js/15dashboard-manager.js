function chartDashboardFeature(r,layer,updateCharts=true,deselectOnClick=true){
	// console.log(r);
	let featureName = r.properties[layer.viz.dashboardFieldName].toString();
	// console.log(featureName)
	if(Object.keys(layer.dashboardSelectedFeatures).indexOf(featureName)===-1){
		layer.dashboardSelectedFeatures[featureName]={'geojson':r,'polyList':[]};
	
	
		function getCoords(c){
			if(c.type === 'Polygon'){
				
				c.coordinates.map(c2=>{
					let polyCoordsT =c2.map(c3=>{return {lng:c3[0],lat:c3[1]}});
					layer.dashboardSelectedFeatures[featureName].polyList.push(new google.maps.Polygon({
						strokeColor:'#0FF',
						fillColor:'#0FF',
						fillOpacity:0.2,
						strokeOpacity: 0,
						strokeWeight: 0,
						path:polyCoordsT,
						zIndex:-999
					}));
				})
					
			}else if(c.type === 'MultiPolygon'){
				// console.log(c);
				c.coordinates.map(c2=>getCoords({type:'Polygon',coordinates:c2}))//c2.map(c3=>c3.map(c4=>coords.push({lng:c4[0],lat:c4[1]}))));
			}else if(c.type === 'GeometryCollection'){
				c.geometries.map(g=>getCoords(g))
			}
		}
		getCoords(r.geometry);
		
		
		// var infoContent = `<table class="table table-hover bg-white">
		// <tbody>`
	
		// Object.keys(info).map(function(name){
		//     var value = info[name];
		//     infoContent +=`<tr><th>${name}</th><td>${value}</td></tr>`;
		// });
		// infoContent +=`</tbody></table>`;
		
		
		
		layer.dashboardSelectedFeatures[featureName].polyList.map(p=>p.setMap(map));
		layer.dashboardSelectedFeatures[featureName].polyList.map(p=>{
			if(deselectOnClick){
				google.maps.event.addListener(p, "click", (event)=>{
					console.log(`deselection clicked: ${event}`)
					layer.dashboardSelectedFeatures[featureName].polyList.map(p=>p.setMap(null));
					delete layer.dashboardSelectedFeatures[featureName];
					updateDashboardCharts();
					updateDashboardHighlights();
				})
			}
			
		});
		
	}
	// else{
	// 	console.log(`Removing ${featureName}`)
	// 	layer.dashboardSelectedFeatures[featureName].polyList.map(p=>p.setMap(null));
	// 	delete layer.dashboardSelectedFeatures[featureName];
	// }
	
	let selectedNames = Object.keys(layer.dashboardSelectedFeatures).join(',');
	// $('#dashboard-results-collapse-div').append(selectedNames);
	if(updateCharts){
		updateDashboardCharts();
		updateDashboardHighlights();
	}
}
function updateProgress(id,val) {
	var el = document.querySelector(`${id} span`);
	el.style.width = val + '%';
	el.innerText = val + '%';
  };

function startDashboardClickLayerSelect(){
	$('#dashboard-download-button').prop('disabled',true);
	google.maps.event.clearListeners(map, 'click');
	
	function updateSelectedDashboardFeatures(event){
		let pt = ee.Geometry.Point([event.latLng.lng(),event.latLng.lat()])
		let visibleDashboardLayers = Object.values(layerObj).filter(v=>v.viz.dashboardSummaryLayer&&v.visible);
		let totalVisible = visibleDashboardLayers.length;
		let totalLoaded = 0;
		$('#loading-spinner-logo').show();
		updateProgress('.progressbar',0);
		$('#loading-progress-div').show();
		
		visibleDashboardLayers.map(layer=>{
			var ft = ee.Feature(layer.queryItem.filterBounds(pt).first()).simplify(5000, 'EPSG:4326');
			
			
			// console.log(`${l.name} ${ft.size().getInfo()}`)
			// console.log(ft.getInfo())

			ft.evaluate((r,failure)=>{
				console.log(r);
				if(r!==undefined){
					if(layer.selectedDashboardGEEFeatures===undefined){
						layer.selectedDashboardGEEFeatures = ee.FeatureCollection([ft])
					}else{
						layer.selectedDashboardGEEFeatures = layer.selectedDashboardGEEFeatures.merge(ee.FeatureCollection([ft]))
					}
					chartDashboardFeature(r,layer);
				}
				totalLoaded++
				let pLoaded = totalLoaded/totalVisible*100
				updateProgress('.progressbar',pLoaded);
				if(pLoaded===100){
					$('#loading-spinner-logo').hide();
					$('#dashboard-download-button').prop('disabled',false);
					// setTimeout(()=>$('#loading-spinner').slideUp(),5.000);
					
				}
			})
		})
	}
	map.addListener('click',function(event){
		console.log(event);
		updateSelectedDashboardFeatures(event);
		})
	
}
function clearAllSelectedDashboardFeatures(){
	let dashboardLayers = Object.values(layerObj).filter(v=>v.viz.dashboardSummaryLayer);
	dashboardLayers.map(layer=>{
		Object.keys(layer.dashboardSelectedFeatures).map(fn=>{
			layer.dashboardSelectedFeatures[fn].polyList.map(p=>p.setMap(null));
			delete layer.dashboardSelectedFeatures[fn];
		});
	});
	
	$('#highlights-table-tabs').empty();
	$('#highlights-table-divs').empty();
	updateDashboardCharts();
	try{
		dragBox.polygon.setMap(null);
	}catch(err){};
	
	$('#loading-progress-div').hide();
}
function stopDashboardClickLayerSelect(){
	google.maps.event.clearListeners(map, 'click');
}
var dragSelectedFeatures;
var boxSelectID=0;

function dashboardBoxSelect(){
	let visibleDashboardLayers = Object.values(layerObj).filter(v=>v.viz.dashboardSummaryLayer&&v.visible);
	if(visibleDashboardLayers.length>0){
		$('#dashboard-download-button').prop('disabled',true);
		let geeBox;
		boxSelectID++;
		const thisBoxSelectID=boxSelectID;
		if(dashboardAreaSelectionMode==='View-Extent'){
			geeBox = eeBoundsPoly;
		}else{
			geeBox = ee.Geometry.Polygon(dragBox.dragBoxPath.map(c=>[c.lng,c.lat]));
			dragBox.stopListening(false);
		}
	
		$('#summary-area-selection-radio').css('pointer-events','none');
		$('#loading-spinner-logo').addClass('fa-spin');
		$('#loading-spinner-logo').show();
		updateProgress('.progressbar',0);
		$('#loading-progress-div').show();
		var boundsFilter = ee.Filter.bounds(geeBox,500);
		
		ee.FeatureCollection(visibleDashboardLayers.map(layer=>layer.queryItem.filter(boundsFilter))).flatten().size().evaluate((n)=>{
			// console.log(n);
			if(n>0 && thisBoxSelectID===boxSelectID){
				
				var i=1;
				visibleDashboardLayers.map(layer=>{
					let selectedFeatures = layer.queryItem.filter(boundsFilter);
					
					let selectedAttributes = selectedFeatures.toList(10000,0).map(f=>ee.Feature(f).toDictionary())
					// selectedAttributes.getInfo(f=>console.log(f))
					selectedFeatures = selectedFeatures.map(f=>f.simplify(500, selectedFeatures.first().geometry().projection()))
					selectedFeatures.evaluate((f,failure)=>{
						console.log(`Failure: ${failure}`);
						let update=false;
						f.features.map(feat=>{
							if(i===n){update=true}
							chartDashboardFeature(feat,layer,update,false);
							let pLoaded = parseInt(i/n*100);
							updateProgress('.progressbar',pLoaded);
							if(pLoaded===100){
								$('#dashboard-download-button').prop('disabled',false);
								$('#loading-spinner-logo').hide();
								$('#summary-area-selection-radio').css('pointer-events','auto');
								if(dashboardAreaSelectionMode==='Drag-Box'){dragBox.startListening();}
								// setTimeout(()=>$('#loading-spinner').slideUp(),5.000);
								
							}
							i++;
							
						})
					})
					
				});
			}else{
				updateProgress('.progressbar',100);
				$('#loading-spinner-logo').hide();
				$('#summary-area-selection-radio').css('pointer-events','auto');
				if(dashboardAreaSelectionMode==='Drag-Box'){dragBox.startListening()}
				
				}
			
		});
	}
}
function dashboardDragboxLayerSelect(){dashboardBoxSelect()}
var dashboardViewExtentListener;
function stopDashboardViewExtentSelect(){
	google.maps.event.removeListener(dashboardViewExtentListener)
	
}
function startDashboardViewExtentSelect(){
	dashboardViewExtentListener = google.maps.event.addListener(map,'idle',()=>{clearAllSelectedDashboardFeatures();dashboardBoxSelect()});
}
var dashboardPlotlyDownloadURLs;
	// var chartFormat = 'Acres';//Options are: Percentage, Acres, Hectares
function makeDashboardCharts(layer,whichOne,annualOrTransition){
	// console.log(layer)
	dashboardPlotlyDownloadURLs = [];
	
	

	var colors = {'Change':["3d4551","f39268","d54309","00a398","1B1716"].map(c =>'#'+c),
						'Land_Cover':["005e00","008000","00cc00","b3ff1a","99ff99","b30088","e68a00","ffad33","ffe0b3","ffff00","AA7700","d3bf9b","ffffff","4780f3","1B1716"].map(c =>'#'+c),
						'Land_Use': ["efff6b","ff2ff8","1b9d0c","97ffff","a1a1a1","c2b34a","1B1716"].map(c =>'#'+c)};
	var names = {'Change':["Stable","Slow Loss","Fast Loss","Gain","Non-Processing Area Mask"],
				'Land_Cover':["Trees",
	"Tall Shrubs & Trees Mix","Shrubs & Trees Mix","Grass/Forb/Herb & Trees Mix","Barren & Trees Mix","Tall Shrubs","Shrubs","Grass/Forb/Herb & Shrubs Mix","Barren & Shrubs Mix","Grass/Forb/Herb", "Barren & Grass/Forb/Herb Mix","Barren or Impervious","Snow or Ice","Water","Non-Processing Area Mask"],
				'Land_Use':["Agriculture","Developed","Forest","Non-Forest Wetland","Other","Rangeland or Pasture","Non-Processing Area Mask"]
				}
	var fieldsHidden={'Change':[true,false,false,false,true]}
	let total_area_fieldname = 'total_area';
	// var titleField = 'TCA_ID'//'LMPU_NAME'//'outID';
	// var chartWhich = ['Change','Land_Cover','Land_Use'];
	if(annualOrTransition === 'transition'){
	
	names['Land_Cover'] = ['Trees','Tall Shrubs','Shrubs','Grass/Forb/Herb','Barren or Impervious','Snow or Ice','Water','Non-Processing Area Mask'];
	colors['Land_Cover'] = ['#005e00','#b30088','#e68a00','#ffff00','#d3bf9b',"#ffffff","#4780f3","#1B1716"]
	}

	var stacked = false;
	var fieldNames = names[whichOne].map(w => whichOne + '---'+w);
	var chartID = `chart-canvas-${layer.id}-${whichOne}-${annualOrTransition}`;
	var colorsI = 0;
	var selectedFeatureNames = Object.keys(layer.dashboardSelectedFeatures);
	// console.log(selectedFeatureNames)
	if(selectedFeatureNames.length>1){
		var area_names = 'LCMS Summary for '+selectedFeatureNames.length.toString()+ ' areas'
	}else{
		var area_names = selectedFeatureNames.join(', ');
	}
	
	
	var name =layer.name+ ' '+area_names + ' - '+whichOne.replace('_',' ');
	///////////////////////////////////////////////////////////////////////
	//Iterate across each field name and add up totals 
	//First get 2-d array of all areas for each then sum the columns and divide by total area
	
	var t1 = new Date();
	let results = {};
	results.features = selectedFeatureNames.map(nm=>layer.dashboardSelectedFeatures[nm].geojson)
	var years = results.features[0].properties['years_'+annualOrTransition].split(',').sort();
	
	
	// console.log(years)
	// console.log(results.features)
	if(annualOrTransition === 'transition'){
		var tableDict = {};
		var fieldNames = Object.keys(results.features[0].properties).filter(v=>v.indexOf(whichOne)>-1).sort();
		
		fieldNames.map((fn)=>{
		var total_area = 0;
		var total = [];
		results.features.map((f)=>{
			var t = f.properties[fn].split(',');
			var scale = f.properties.scale;
			
			total.push(f.properties[fn].split(',').map(n => parseFloat(n)*scale**2));
			var total_areaF = parseFloat(f.properties[total_area_fieldname]);
			total_area = total_area + total_areaF*scale**2;
		});
		
		// console.log(total)
		var colSums = [];
		for(var col = 0;col < total[0].length;col++){
			var colSum = 0;
			for(var row = 0;row < total.length;row++){
			colSum = colSum + total[row][col];
			}
			colSums.push(colSum);
		};
		//Convert from sq m to chosen area unit
		if(chartFormat === 'Percentage'){
			colSums = colSums.map((n)=>n/total_area*100);
		}else{
			colSums = colSums.map((n)=>n*chartFormatDict[chartFormat].mult);
		}
		if(Math.max(...colSums)>-1){tableDict[fn]=colSums}
		});
		// console.log(tableDict);
		
		// console.log(whichOne);console.log(fieldNames)
		//Clean out existing chart  
		
		$(`#${chartID}`).remove();  
		//Add new chart
		$('#dashboard-results-div').append(`<div class = "plotly-chart" id="${chartID}"><div>`);
		$('#dashboard-results-div').append(`<div class = "plotly-chart plotly-chart-download" id="${chartID}-download"><div>`);
		// $('#chartDiv').append('<hr>');
		//Set up chart object
		// var chartJSChart = new Chart($(`#${chartID}`),{
		// add data
		var yri = 0;
		var data = [];
		var sankey_dict = {source:[],target:[],value:[]};
		var sankeyPalette = [];
		var labels = [];
		var label_code_dict = {};
		var label_code_i = 0;
		var allYears = years.map((yr)=>{return yr.split('_')[0]});
		allYears.push(years[years.length-1].split('_')[1]);
		// console.log(allYears)
		allYears.map((yr)=>{
		
		names[whichOne].map((nm)=>{
			var outNm = yr+' '+nm;
			labels.push(outNm);
			label_code_dict[outNm] = label_code_i;
			label_code_i++;
		});
		colors[whichOne].map((nm)=>{sankeyPalette.push(nm)});
			
		});
		// console.log(tableDict)
		// console.log(label_code_dict);
		years.map((yr)=>{
		var startRange = yr.split('_')[0];
		var endRange = yr.split('_')[1];
		
		Object.keys(tableDict).map((k)=>{
			var transitionClass = k.split('---')[1];
			var transitionFromClassI = parseInt(transitionClass.split('-')[0])-1;
			var transitionFromClassName = names[whichOne][transitionFromClassI];
			var transitionToClassName = names[whichOne][parseInt(transitionClass.split('-')[1])-1];
			var v = tableDict[k][yri];
			var fromLabel = startRange+' '+transitionFromClassName;
			var toLabel = endRange+' '+transitionToClassName
			
			
			sankey_dict.source.push(label_code_dict[fromLabel]);
			sankey_dict.target.push(label_code_dict[toLabel]);
			sankey_dict.value.push(v);
			
		
			
			

		})
		yri++;
		})


		// console.log(sankey_dict)
		sankey_dict.hovertemplate='%{value}'+chartFormatDict[chartFormat].label+' %{source.label}-%{target.label}<extra></extra>'

		var data = {
		type: "sankey",
		orientation: "h",
		node: {
			pad: 10,
			thickness: 20,
			line: {
			color: "black",
			width: 0.5
			},
			label: labels,
			color: sankeyPalette,
			hovertemplate:'%{value}'+chartFormatDict[chartFormat].label+' %{label}<extra></extra>'
			},

		link: sankey_dict,

		}

		var data = [data]
		let plotHeight =$('#dashboard-results-div').height()-convertRemToPixels(2); 
		let plotWidth=plotHeight*1.5
		var layout = {
		title: `<b>${name}</b>`,
		font: {
			size: 8
		},
		margin: {
			l: 15,
			r: 15,
			b: 25,
			t: 30,
			pad:50
		},
		paper_bgcolor: '#D6D1CA',
		plot_bgcolor: '#D6D1CA',
		autosize: false,
		height:plotHeight,
		width:plotWidth
  		
		}
		var config = {
			toImageButtonOptions: {
				format: 'png', // one of png, svg, jpeg, webp
				filename: name,
				//width:1000,height:600,
			},
			scrollZoom: true,
			displayModeBar: false
			};
	
		let layout2 = JSON.parse(JSON.stringify(layout));;
		
		layout2.font.size=20;
		layout2.margin.t=80;
		layout2.margin.pad=20;
		// console.log([layout2.font.size,layout.font.size])
		Plotly.newPlot(`${chartID}-download`, data, layout2,config).then((chart)=>{
			Plotly.toImage(chart,{width:1200,height:800})
				 .then(url=>dashboardPlotlyDownloadURLs.push(url))});
				//  layout.font.size=8;
		Plotly.newPlot(`${chartID}`, data, layout,config);
	}else if(annualOrTransition === 'annual'){
		var startI = years.indexOf(urlParams.startYear.toString());
        var endI = years.indexOf((urlParams.endYear).toString())+1;
        years = years.slice(startI,endI);
		if(showPairwiseDiff){
			years = years.slice(1,years.length);
			// console.log(`Diff years: ${years}`)
		}
		// console.log(years)
		fieldNames =fieldNames.filter(v=>v.indexOf(whichOne)>-1).sort();
		// console.log(fieldNames)
		
        var t = fieldNames.map(function(k){
          var total_area = 0;
          var total = [];

          results.features.map(function(f){
            // console.log(f.attributes)
            try{
              var scale = f.properties.scale;
              
              total.push(f.properties[k].split(',').slice(startI,endI).map(n => parseFloat(n)));
              var total_areaF = parseFloat(f.properties[total_area_fieldname]);
              total_area = total_area + total_areaF;
            }catch(err){
              console.log('No LCMS summary for: '+f.properties[titleField]);
    //           // console.log(err);
            }
            
           })
		   
          var colSums = [];
          for(var col = 0;col < total[0].length;col++){
            var colSum = 0;
            for(var row = 0;row < total.length;row++){
              colSum = colSum + total[row][col];
            }
            colSums.push(colSum);
          };
		  
          //Convert from sq m to chosen area unit
          if(chartFormat === 'Percentage'){
            colSums = colSums.map((n)=>n/total_area*100);
          }else{
            colSums = colSums.map((n)=>n*chartFormatDict[chartFormat].mult);
          }
		  
          if(showPairwiseDiff){
            var pairwiseDiff = [];
            for(var i=0;i<colSums.length-1;i++){
              var left = colSums[i];
              var right = colSums[i+1];
              pairwiseDiff.push(right-left)
            }
            colSums = pairwiseDiff;
            
          }
        //   console.log(colSums)
          ///////////////////////////////////////////////////////////////////////
          //Set up chart object
		  let fieldHidden;
		  try{
			fieldHidden = fieldsHidden[whichOne][names[whichOne].indexOf(k.split('---')[1])];
		  }catch(err){
			fieldHidden=false;
		  }
		 
		  let classColor = colors[whichOne][names[whichOne].indexOf(k.split('---')[1])]
            var out = {'borderColor':classColor,
            'fill':false,
            'data':colSums,
            'label':k.split('---')[1],
            pointStyle: 'line',
            pointRadius:1,
            'lineTension':0,
            'borderWidth':2,
            'steppedLine':false,
            'showLine':true,
            'spanGaps':true,
			'hidden':fieldHidden,
            'fill' : stacked,
            'backgroundColor':classColor}
            colorsI ++;
            return out;
          })

      //Clean out existing chart  
      try{
        chartJSChart.destroy(); 
      }
      catch(err){};
      $(`#${chartID}`).remove(); 

	let chartHeight=$('#dashboard-results-div').height()-convertRemToPixels(1);
	let chartWidth = chartHeight*1.5;
	$('#dashboard-results-div').append(`<div  class = "chartjs-chart chart-container" ><canvas title='Click on classes on the bottom of this chart to turn them on and off' id="${chartID}"><canvas></div>`);
      // $('#chartDiv').append('<hr>');
      //Set up chart object
      var chartJSChart = new Chart($(`#${chartID}`),{
        type: 'line',
        data: {"labels": years,
        "datasets":t},
        options:{
          responsive: true,
          maintainAspectRatio: false,
		// height:chartHeight,
		// width:chartWidth,
		// width:chartHeight*2,
        //   aspectRatio: 1.5,
           title: {
                display: true,
                position:'top',
                text: name,
                fontSize: 12,
				wrap: true,
				maxWidth: 50
            },
            legend:{
              display:true,
              position:'bottom',
              labels : {
				usePointStyle: true,
				fontSize:10,
                boxWidth:5,
				pointStyle:'circle',
				padding:5,
				
              },
            },
            chartArea: {
                backgroundColor: '#D6D1CA'
            },
            scales: {
              yAxes: [{ stacked: stacked ,ticks: {fontSize: 10},scaleLabel:{display:true,labelString:chartFormatDict[chartFormat].label}}],
              xAxes: [{ stacked: stacked ,ticks: {fontSize: 10},scaleLabel:{display:true,labelString:'Year'},maxBarThickness: 100}]
            },
			labels:{
				padding:0
			}
          }
        });

		$('.chartjs-chart').css('height',chartHeight);
		$('.chartjs-chart').css('width',chartWidth);
	}
}
var currentHighlightsMoveID=1;
if(urlParams.currentlySelectedHighlightTab == null || urlParams.currentlySelectedHighlightTab == undefined){
	urlParams.currentlySelectedHighlightTab;
 }
function getHighlightsTabListener(){return $('a.nav-link').click(e=>{urlParams.currentlySelectedHighlightTab=e.currentTarget.id})
}

function updateDashboardHighlights(limit=10){
	currentHighlightsMoveID++;
	let thisHighlightsMoveID=currentHighlightsMoveID;
	let isFirst = true;
	let chartWhich = Object.keys(whichProducts).filter(k=> whichProducts[k]).map(i=>i.replaceAll('-','_'));
	
	let available_years = range(startYear,endYear+1);
	let startYearI = available_years.indexOf(parseInt(urlParams.startYear));
	let endYearI = available_years.indexOf(parseInt(urlParams.endYear));

	// console.log([startYearI,endYearI])
	let dashboardLayersToHighlight = Object.values(layerObj).filter(v=>v.viz.dashboardSummaryLayer&&v.visible);
	
	$('#highlights-table-tabs').empty();
	$('#highlights-table-divs').empty();
	let totalToLoad=0;
	let totalLoaded=0;
	let classesToHighlight=0;
	let firstID;
	if(dashboardLayersToHighlight.length>0){
		// $('#highlights-loading-spinner-logo').show();
		// updateProgress('#highlights-progressbar',0);
		dashboardLayersToHighlight.map(f=>{
			// let fc = f.queryItem.filterBounds(eeBoundsPoly);
			fc= Object.values(f.dashboardSelectedFeatures).map(f=>f.geojson);
			let fieldName = f.viz.dashboardFieldName;
			// console.log(f.selectedTSData.size().getInfo())
			
			
			// console.log(fc.first().getInfo())
			// Map2.addLayer(fc,{},f.name+' bounds')
			Object.keys(highlightLCMSProducts).map(k=>{
				if(chartWhich.indexOf(k)>-1){
					let product_name = k.replaceAll('_',' ');
					// console.log(product_name)
					let tab_name = f.name;
					let classes = highlightLCMSProducts[k];
					classesToHighlight = classesToHighlight+classes.length
					if(classes.length>0){
						classes.map(cls=>{
							var class_name = `${k}---${cls}`;
							var ts_class_name = `TS---${k}---${cls}`;
							let t = [];
							let ft = fc.map(f=>{
			// 					f = ee.Feature(f);
								let props = f.properties;
								let tsProps = props[ts_class_name].split(',');
								// console.log(tsProps)

								// From http://www.stat.yale.edu/Courses/1997-98/101/catinf.htm
								let tsCounts = props['TS_counts'].split(',');
								let attributes = props[class_name].split(',');
								let totalArea = parseFloat(props['total_area']);
								let startAtr,endAtr,startCILow,startCIHigh,endCILow,endCIHigh;

								let startTSProp = parseFloat(tsProps[startYearI]);
								let endTSProp = parseFloat(tsProps[endYearI]);
								let startTSCount = parseFloat(tsCounts[startYearI]);
								let endTSCount = parseFloat(tsCounts[endYearI]);

								let ci = ciDict[ciLevel];//1.96;
								let startCI = ci*Math.sqrt((startTSProp*(1-startTSProp))/startTSCount);
								let endCI = ci*Math.sqrt((endTSProp*(1-endTSProp))/endTSCount);
								
								if(chartFormat === 'Percentage'){
									startAtr = parseFloat(attributes[startYearI])/totalArea*100;
									endAtr = parseFloat(attributes[endYearI])/totalArea*100;

									startCI = startCI*100;
									endCI = endCI*100;

									startTSProp = startTSProp*100;
									endTSProp = endTSProp*100;
									
								}else{
									startAtr = parseFloat(attributes[startYearI])*chartFormatDict[chartFormat].mult;
									endAtr = parseFloat(attributes[endYearI])*chartFormatDict[chartFormat].mult;

									startCI = totalArea*chartFormatDict[chartFormat].mult*startCI;
									endCI = totalArea*chartFormatDict[chartFormat].mult*endCI;

									startTSProp = totalArea*chartFormatDict[chartFormat].mult*startTSProp;
									endTSProp = totalArea*chartFormatDict[chartFormat].mult*endTSProp;
								}

								// console.log(cls);
								// console.log([cls,startTSProp,endTSProp,startTSCount,endTSCount,startCI,endCI])
								let isSig = false;
								if(startTSProp ===0){
									startCI = 'NA';
									startCILow = 'NA';
									startCIHigh = 'NA';
								}
								if(endTSProp ===0){
									endCI = 'NA';
									endCILow = 'NA';
									endCIHigh = 'NA';
								}
								if(startTSProp > 0 && endTSProp > 0){
									startCILow = startAtr-startCI;
									startCIHigh = startAtr+startCI;

									endCILow = endAtr-endCI;
									endCIHigh = endAtr+endCI;
									
									if(startCILow>endCIHigh || startCIHigh < endCILow){
										isSig = true;
									}
									
									
								}
								if(startCI !== 'NA'){
									startCI = startCI.toFixed(chartFormatDict[chartFormat].places);
								}
								if(endCI !== 'NA'){
									endCI = endCI.toFixed(chartFormatDict[chartFormat].places);
								}
								

								let diff = endAtr-startAtr;
								let rel = diff/startAtr*100;

								t.push([props[fieldName],
									startAtr.toFixed(chartFormatDict[chartFormat].places).numberWithCommas(),
									startTSProp.toFixed(chartFormatDict[chartFormat].places).numberWithCommas(),
									startCI.numberWithCommas(),
									endAtr.toFixed(chartFormatDict[chartFormat].places).numberWithCommas(),
									endTSProp.toFixed(chartFormatDict[chartFormat].places).numberWithCommas(),
									endCI.numberWithCommas(),
									diff.toFixed(chartFormatDict[chartFormat].places).numberWithCommas(),
									rel.toFixed(chartFormatDict[chartFormat].places),
									isSig]);
			// 					return f.set({'1start':startAtr,'2end':endAtr,'3start-end_diff':diff })
								})
							// let sortMethod = highlightsSortingDict[cls];
							// if(sortMethod==='asc'){
							// 	t= t.sort(function(a,b) {
							// 		return a[3] - b[3];
							// 	});
							// }else{
							// 	t= t.sort(function(a,b) {
							// 		return b[3] - a[3];
							// 	});
							// }
							
							
							
							let nmT = `${f.viz.dashboardFieldName}`
							let startYrAbbrv = urlParams.startYear.toString().slice(2,4);
							let endYrAbbrv = urlParams.endYear.toString().slice(2,4);
							
							function parseResults(t,header){
									totalLoaded++;
									let pLoaded=totalLoaded/totalToLoad*100;
									// updateProgress('#highlights-progressbar',pLoaded);
									// if(pLoaded===100){
										// $('#highlights-loading-spinner-logo').hide();
									// }
									let nRows = t.length;
									let areasN = 'areas'
									if(nRows===1){
										areasN = 'area'
									}
									let clsID = cls.replaceAll('/','-');
									clsID = clsID.replaceAll(' ','-');
									let navID=`${f.legendDivID}-${k}-${clsID}`;
									// console.log(navID);
									let isActive = '';
									if(isFirst){isActive= ' show active'}
									$('#highlights-table-tabs').append(`<li class="nav-item" role="presentation" title='Click to show sorted table of ${tab_name}-${cls} change from ${urlParams.startYear}-${urlParams.endYear}'>
																			<a
																			class="nav-link ${isActive}"
																			id="${navID}-tab"
																			data-toggle="tab"
																			href="#${navID}-table-container"
																			role="tab"
																			aria-controls="${navID}-table_wrapper"
																			aria-selected="${isFirst}">${tab_name}-${cls}</a>
																		</li>`);
									
									
									$('#highlights-table-divs').append(`<div id = "${navID}-table-container">
									<table
									class="table table-hover report-table"
									id="${navID}-table"
									role="tabpanel"
									tablename="${tab_name}-LCMS ${k.replaceAll('_',' ')} ${cls}"
									aria-labelledby="${navID}-tab"
								  ></table>
								  <div id = "${navID}-boxplots"></div>
								  </div>`);
								  
								  
								  isFirst = false;						
								  
									$(`#${navID}-table`).append(`<thead><tr class = ' highlights-table-section-title'>
									
									<th>
										Name (bold = sig ${ciLevel}% CI)
									</th>
									<th>
										${urlParams.startYear} ${chartFormatDict[chartFormat].label}
									</th>
									
									<th>
										${urlParams.endYear} ${chartFormatDict[chartFormat].label}
									</th>
									
									<th title ="Absolute change between '${startYrAbbrv} and '${endYrAbbrv}">
										Change ${chartFormatDict[chartFormat].label}
									</th>
									
									
									</tr></thead>`)
									let rowI = 1;
									
									t.map(tr=>{
										let sigClass = 'highlights-insig';
										let sigStar = '';
										let sigTitle = `No significant change detected (${ciLevel}% CI)`;
										if(tr[9]){
											sigClass = 'highlights-sig';
											sigStar = '*';
											sigTitle = `Significant change detected (${ciLevel}% CI)`;
										}

										// var data = [
										// 	{
										// 	  x: [urlParams.startYear, urlParams.endYear],
										// 	  y: [tr[1], tr[3]],
										// 	  error_y: {
										// 		type: 'data',
										// 		array: [tr[2], tr[4]],
										// 		visible: true
										// 	  },
										// 	  type: 'scatter'
										// 	}
										//   ];
										//   var layout = {
										// 	title: tr[0],
										// 	font: {
										// 	size: 12
										// 	},
										// 	autosize: true,
										// 	margin: {
										// 	l: 25,
										// 	r: 25,
										// 	b: 25,
										// 	t: 50,
										// 	pad: 4
										// 	},
										// 	paper_bgcolor: '#D6D1CA',
										// 	plot_bgcolor: '#D6D1CA'
										// }
										// var config = {
										// 	toImageButtonOptions: {
										// 		format: 'png', // one of png, svg, jpeg, webp
										// 		filename: tr[0],
										// 		width:1000,height:600
										// 	},
										// 	scrollZoom: false,
										// 	displayModeBar: false
										// 	};
										
										//   $(`#${navID}-boxplots`).append(`<div id='${navID}-boxplot-${rowI}'></div>`)
										//   Plotly.newPlot(`${navID}-boxplot-${rowI}`, data, layout,config);
										$(`#${navID}-table`).append(`<tr class = 'highlights-row' title= '${sigTitle}'>
									<th class = 'highlights-entry ${sigClass}'>${tr[0]}</th>
									<td class = 'highlights-entry ${sigClass}'>${(tr[1])} &plusmn ${(tr[3])}</td>
									
									<td class = 'highlights-entry ${sigClass}'>${(tr[4])} &plusmn ${(tr[6])}</td>
									
									<td class = 'highlights-entry ${sigClass}'>${(tr[7])}</td>
									
									
									</tr>`);
									
									rowI++;})
									
									let downloadName = `LCMS_Change_Summaries_${tab_name}_${cls}_${urlParams.startYear}-${urlParams.endYear}`
									$(document).ready(function () {
										$(`#${navID}-table`).DataTable({
											fixedHeader: false,
											paging: false,
											searching: true,
											order: [[3, highlightsSortingDict[cls]]],
											responsive:true,
											dom: 'Bfrtip',
											buttons: [
												// {
												// 	extend: 'colvis',
												// 	title: 'Data export'
												// },
												{
													extend: 'copyHtml5',
													title: downloadName.replaceAll('_',' '),
													messageBottom: staticTemplates.dashboardHighlightsDisclaimerText
												},
												{
													extend: 'csvHtml5',
													title: downloadName.replaceAll('_',' '),
													messageBottom: staticTemplates.dashboardHighlightsDisclaimerText
												},
												{
													extend: 'excelHtml5',
													title: downloadName.replaceAll('_',' '),
													messageBottom: staticTemplates.dashboardHighlightsDisclaimerText
												},
												{
													extend: 'pdfHtml5',
													title: downloadName.replaceAll('_',' '),
													messageBottom: staticTemplates.dashboardHighlightsDisclaimerText
												},
												{
													extend: 'print',
													title: downloadName.replaceAll('_',' '),
													messageBottom: staticTemplates.dashboardHighlightsDisclaimerText
												},
											]
												
											
											
										});
										$(`#${navID}-table-container`).addClass(`tab-pane fade bg-white highlights-table ${isActive}`);
									
										// $('.dataTables_length').addClass('bs-select');
									  });
							}
							// totalToLoad = totalToLoad+2;
							if(t.length>0){
								parseResults(t,'Change')
							}
							
							// parseResults(bottom,'Loss')
			// 				// console.log(bottoms.getInfo())
						
							})
						}
					}
					
				
				})
				
				
			})
			// if(classesToHighlight===0){$('#highlights-loading-spinner-logo').hide();updateProgress('#highlights-progressbar',100);}
		
	}
	// else{
	// 	$('#highlights-loading-spinner-logo').hide();updateProgress('#highlights-progressbar',100);
	// }
	
	// $('#highlights-table-divs').prepend(staticTemplates.dashboardDownloadReportButton)
	getHighlightsTabListener();
	if(urlParams.currentlySelectedHighlightTab !==undefined){
		$(`#${urlParams.currentlySelectedHighlightTab}`).click();
	}
	resizeDashboardPanes();
	// console.log(dashboardLayersToHighlight)
}

function updateDashboardCharts(){
	let lastScrollLeft = dashboardScrollLeft;
	// console.log(`Scroll left coord: ${lastScrollLeft}`)
	$('.dashboard-results').empty();
	$('.dashboard-results-container').hide();
	$('.dashboard-results-container').css('height','0rem');

	// $('.dashboard-results-container').hide();
	let visible,chartModes;
	chartWhich = Object.keys(whichProducts).filter(k=> whichProducts[k]).map(i=>i.replaceAll('-','_'));
	chartModes = Object.keys(annualTransition).filter(k=> annualTransition[k]).map(k=>k.toLowerCase())
	
	let dashboardLayersToChart = Object.values(layerObj).filter(v=>v.viz.dashboardSummaryLayer&&v.visible&&Object.keys(v.dashboardSelectedFeatures).length > 0);
	if(dashboardLayersToChart.length>0){
		$('.dashboard-results-container').show();
		$('.dashboard-results-container').css('height',dashboardResultsHeight);
		resizeDashboardPanes();
		chartWhich.map((w)=>{
			dashboardLayersToChart.map(layer=>{
				chartModes.map(chartMode=>makeDashboardCharts(layer,w,chartMode));
			})
		})
		
		
			$( ".dashboard-results" ).scrollLeft(lastScrollLeft);
	}else{
		resizeDashboardPanes();
	}
	
	// setTimeout(makeDashboardReport(),1000);
	
}