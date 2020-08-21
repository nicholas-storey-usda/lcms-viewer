/*List global variables in this script for use throughout the viewers*/
var urlParamsObj = {};
var pageUrl = document.URL;
var urlParams = new Proxy(urlParamsObj, {
  set: function (target, key, value) {
      // console.log(`${key} set to ${value}`);
      //
      target[key] = value;
      // console.log(urlParams);
       var deepLink = [window.location.pathname,constructUrlSearch()].join('')
            // console.log(deepLink)
            var obj = { Title: 'test', Url: deepLink };
            history.pushState(obj, obj.Title, obj.Url);
            pageUrl = document.URL;
            // console.log(pageUrl)
      return true;
  }
});
function parseUrlSearch(){
  console.log(window.location.search == '')
    var urlParamsStr = window.location.search;
   
    if(urlParamsStr !== ''){
      urlParamsStr = urlParamsStr.split('?')[1].split('&');
    
    urlParamsStr.map(function(str){
        urlParams[str.split('=')[0]] = str.split('=')[1]
    })}
    
   
}
function constructUrlSearch(){
  var outURL = '?';
  Object.keys(urlParams).map(function(p){
    outURL += p+'='+urlParams[p] + '&'
  })
  outURL = outURL.slice(0,outURL.length-1)
  return outURL
}
/*Load global variables*/
var cachedSettingskey = 'settings';
var startYear = 1985;
var endYear = 2019;
var startJulian = 153;//190;
var endJulian = 274;//250;
var layerObj = null;
var queryObj = {};var timeLapseObj = {};
parseUrlSearch()
var initialCenter = [37.5334105816903,-105.6787109375];
var initialZoomLevel = 5;
var studyAreaSpecificPage = false;
var studyAreaDict = {
                  'Flathead National Forest':{
                                                name:'FNF',
                                                center:[48.16,-115.08,8],
                                                crs:'EPSG:26911',
                                                lossThresh:0.4,
                                                lossFastThresh:0.4,
                                                lossSlowThresh:0.35,
                                                gainThresh:0.45,
                                                startYear:1985,
                                                endYear:2019,
                                            	popOver:"Flathead National Forest buffered along with Glacier National Park buffered by 1km",
                                              addFastSlow:true,
                                              addGainThresh:true,
                                              compositeCollection:'projects/USFS/LCMS-NFS/R1/FNF/Composites/Composite-Collection-fmask-allL7',
                                              lcmsCollection:'projects/USFS/LCMS-NFS/R1/FNF/Landcover-Landuse-Change/Landcover-Landuse-Change-Collection-v2019-3',
                                              ltCollection:'projects/USFS/LCMS-NFS/R1/FNF/Base-Learners/LANDTRENDR-Collection-fmask-allL7',
                                              ltFormat:'landtrendr_vertex_format'
                                            },
                                              
                  'Bridger-Teton National Forest':{
                                                  name:'BTNF',
                                                  center:[43.4,-111.1,8],
                                                  crs:'EPSG:26912',
                                                  lossThresh:0.4,
                                                  lossFastThresh:0.25,
                                                  lossSlowThresh:0.4,
                                                  gainThresh:0.45,
                                                  startYear : 1985,
                                                  endYear : 2019,
                                              	  popOver:"Bridger-Teton National Forest boundary buffered by 5km plus Star Valley",
                                                  addFastSlow:true,
                                                  addGainThresh:true,
                                                  compositeCollection:'projects/USFS/LCMS-NFS/R4/Composites/Composite-Collection-fmask-allL7',
                                                  lcmsCollection:'projects/USFS/LCMS-NFS/R4/BT/Landcover-Landuse-Change/Landcover-Landuse-Change-Collection-v2019-3',
                                                  ltCollection:'projects/USFS/LCMS-NFS/R4/Base-Learners/LANDTRENDR-Collection-fmask-allL7',
                                                  ltFormat:'landtrendr_vertex_format'
                                            },
                  'Manti-La Sal National Forest':{
                                                  name:'MLSNF',
                                                  center:[38.8,-111,8],
                                                  crs:'EPSG:26912',
                                                  lossThresh:0.3,
                                                  lossFastThresh:0.4,
                                                  lossSlowThresh:0.3,
                                                  gainThresh:0.3,
                                                  startYear: 1985,
                                                  endYear: 2019,
                                              	  popOver:"Manti-La Sal National Forest",
                                                  addFastSlow:true,
                                                  addGainThresh:true,
                                                  compositeCollection:'projects/USFS/LCMS-NFS/R4/Composites/Composite-Collection-fmask-allL7',
                                                  lcmsCollection: 'projects/USFS/LCMS-NFS/R4/MLS/Landcover-Landuse-Change/Landcover-Landuse-Change-Collection-v2019-3',
                                                  ltCollection:'projects/USFS/LCMS-NFS/R4/Base-Learners/LANDTRENDR-Collection-fmask-allL7',
                                                  ltFormat:'landtrendr_vertex_format'
                                            },
                  'Chugach National Forest - Kenai Peninsula':{
                                                name:'CNFKP',
                                                center:[60.4,-150.1, 9],
                                                crs:'EPSG:3338',
                                                lossThresh:0.35,
                                                gainThresh:0.45,
                                                startYear:1985,
                                                endYear:2019,
                                            	popOver:"Chugach National Forest - Kenai Peninsula",
                                              addFastSlow:true,
                                              addGainThresh:true,
                                              compositeCollection:'projects/USFS/LCMS-NFS/R10/CK/Composites/Composite-Collection-cloudScoreTDOM2',
                                              lcmsCollection:'projects/USFS/LCMS-NFS/R10/CK/Landcover-Landuse-Change/Landcover-Landuse-Change-Collection',
                                              ltCollection:'projects/USFS/LCMS-NFS/R10/CK/Base-Learners/LANDTRENDR-Collection2019',
                                              ltFormat:'landtrendr_vertex_format',
                                              lcmsSecondaryLandcoverCollection:'projects/USFS/LCMS-NFS/R10/CK/Landcover-Landuse-Change/Landcover_Probability',
                                              lcmsSecondaryLandcoverTreemask:'projects/USFS/LCMS-NFS/R10/CK/Landcover-Landuse-Change/Landcover_Probability_treemask_stack',
                                          
                                              lcmsSecondaryLandcoverDict:{
                                                          1: {'modelName': 'Trees',
                                                                  'legendName': 'Trees',
                                                                  'color': '005e00'},
                                                          2: {'modelName': 'TallShrubs-Trees',
                                                                  'legendName': 'Trees/Tall Shrubs Mix',
                                                                  'color': '008000'},
                                                          3: {'modelName': 'Shrubs-Trees',
                                                                  'legendName': 'Trees/Shrubs Mix',
                                                                  'color': '00cc00'},
                                                          4: {'modelName': 'Grass-Trees',
                                                                  'legendName': 'Trees/Grass Mix',
                                                                  'color': 'b3ff1a'},
                                                          5: {'modelName': 'Barren-Trees',
                                                                  'legendName': 'Trees/Barren Mix',
                                                                  'color': '99ff99'},
                                                          6: {'modelName': 'TallShrubs',
                                                                  'legendName': 'Tall Shrubs',
                                                                  'color': 'b30055'},               
                                                          7: {'modelName': 'Shrubs',
                                                                  'legendName': 'Shrubs',
                                                                  'color': 'e68a00'},//'a33d00'},
                                                          8: {'modelName': 'Grass-Shrubs',
                                                                  'legendName': 'Shrubs/Grass Mix',
                                                                  'color': 'ffad33'},//'e26b00'},
                                                          9: {'modelName': 'Barren-Shrubs',
                                                                  'legendName': 'Shrubs/Barren Mix',
                                                                  'color': 'ffe0b3'},//'f49b00'},               
                                                          10: {'modelName': 'Grass',
                                                                  'legendName': 'Grass',
                                                                  'color': 'FFFF00'},
                                                          11: {'modelName': 'Barren-Grass',
                                                                  'legendName': 'Grass/Barren Mix',
                                                                  'color': 'AA7700'},
                                                          12: {'modelName': 'Barren',
                                                                  'legendName': 'Barren or Impervious',
                                                                  'color': 'd3bf9b'},
                                                          13: {'modelName': 'Snow',
                                                                  'legendName': 'Snow/Ice',
                                                                  'color': 'ffffff'},
                                                          14: {'modelName': 'Water',
                                                                  'legendName': 'Water',
                                                                  'color': '4780f3'}
                                                                },
                                              lcmsSecondaryLandcoverTreeClassMax:6
                                            },
                  'USFS Intermountain Region':{
                                                name:'R4',
                                                center:[40.257866715877526,-114.51403372873794, 6],
                                                crs:'EPSG:26912',
                                                lossThresh:0.35,
                                                lossFastThresh :0.3,
                                                lossSlowThresh  :0.4,
                                                gainThresh:0.4,
                                                startYear:1985,
                                                endYear:2019,
                                              popOver:"US Forest Service Intermountain Region 4",
                                              addFastSlow:true,
                                              addGainThresh:true,
                                              compositeCollection:'projects/USFS/LCMS-NFS/R4/Composites/Composite-Collection-fmask-allL7',
                                              lcmsCollection:'projects/USFS/LCMS-NFS/R4/Landcover-Landuse-Change/R4_all_epwt_annualized',
                                              ltCollection:'projects/USFS/LCMS-NFS/R4/Base-Learners/LANDTRENDR-Collection-fmask-allL7',
                                              ltFormat:'landtrendr_vertex_format',
                                              lcmsSecondaryLandcoverCollection:'projects/USFS/LCMS-NFS/R4/Landcover-Landuse-Change/Landcover_Probability_epwt',
                                              lcmsSecondaryLandcoverTreemask:'projects/USFS/LCMS-NFS/R4/Landcover-Landuse-Change/Landcover_Probability_epwt_treemask_stack',
                                              lcmsSecondaryLandcoverDict:{1: {'modelName': 'Trees',
                                                                                  'legendName': 'Trees',
                                                                                  'color': '005e00'},
                                                                          2: {'modelName': 'Shrubs-Trees',
                                                                                  'legendName': 'Trees/Shrubs Mix',
                                                                                  'color': '008000'},
                                                                          3: {'modelName': 'Grass-Trees',
                                                                                  'legendName': 'Trees/Grass Mix',
                                                                                  'color': 'b3ff1a'},
                                                                          4: {'modelName': 'Barren-Trees',
                                                                                  'legendName': 'Trees/Barren Mix',
                                                                                  'color': '99ff99'},
                                                                          5: {'modelName': 'Shrubs',
                                                                                  'legendName': 'Shrubs',
                                                                                  'color': 'e68a00'},
                                                                          6: {'modelName': 'Grass-Shrubs',
                                                                                  'legendName': 'Shrubs/Grass Mix',
                                                                                  'color': 'ffad33'},
                                                                          7: {'modelName': 'Barren-Shrubs',
                                                                                  'legendName': 'Shrubs/Barren Mix',
                                                                                  'color': 'ffe0b3'},               
                                                                          8: {'modelName': 'Grass',
                                                                                  'legendName': 'Grass',
                                                                                  'color': 'FFFF00'},
                                                                          9: {'modelName': 'Barren-Grass',
                                                                                  'legendName': 'Grass/Barren Mix',
                                                                                  'color': 'AA7700'},
                                                                          10: {'modelName': 'Barren',
                                                                                  'legendName': 'Barren or Impervious',
                                                                                  'color': 'd3bf9b'},
                                                                          11: {'modelName': 'Water',
                                                                                  'legendName': 'Water',
                                                                                  'color': '4780f3'}},
                                              lcmsSecondaryLandcoverTreeClassMax:4
                                            },
                  'Science Team CONUS':{
                                                name:'CONUS',
                                                center:[37.5334105816903,-105.6787109375,5],
                                                crs:'EPSG:5070',
                                                lossThresh:0.30,
                                                gainThresh:0.30,
                                                startYear:1985,
                                                endYear:2019,
                                            	popOver:"2019 LCMS Science Team CONUS-wide loss",
                                              addFastSlow:false,
                                              addGainThresh:false,
                                              compositeCollection:'projects/LCMS/CONUS_MEDOID',
                                              lcmsCollection:'projects/LCMS/CONUS_Products/v20200120',
                                              ltCollection:'projects/LCMS/CONUS_Products/LT20200120'
                                            }
                };
////////////////////////////////////////////////////////////////////////////////
/*Initialize parameters for loading study area when none is chosen or chached*/
var defaultStudyArea = 'USFS Intermountain Region';
var studyAreaName = studyAreaDict[defaultStudyArea].name;
var longStudyAreaName = defaultStudyArea;
var cachedStudyAreaName = null;
var viewBeta = 'yes';
var lowerThresholdDecline = studyAreaDict[defaultStudyArea].lossThresh;
var upperThresholdDecline = 1.0;
var lowerThresholdRecovery = studyAreaDict[defaultStudyArea].gainThresh;
var upperThresholdRecovery = 1.0;

var lowerThresholdSlowLoss = studyAreaDict[defaultStudyArea].lossSlowThresh;
var upperThresholdSlowLoss = 1.0;
var lowerThresholdFastLoss = studyAreaDict[defaultStudyArea].lossFastThresh;
var upperThresholdFastLoss = 1.0;
if(lowerThresholdSlowLoss === undefined){lowerThresholdSlowLoss = lowerThresholdDecline}
if(lowerThresholdFastLoss === undefined){lowerThresholdFastLoss = lowerThresholdDecline} 

 
/*Set up some boundaries of different areas to zoom to*/
var clientBoundsDict = {'All':{"geodesic": false,"type": "Polygon","coordinates": [[[-169.215141654273, 71.75307977193499],
        [-169.215141654273, 15.643479915898974],
        [-63.043266654273, 15.643479915898974],
        [-63.043266654273, 71.75307977193499]]]},
                    'CONUS':{"geodesic": false,"type": "Polygon","coordinates": [[[-148.04139715349993,30.214881196707502],[-63.66639715349993,30.214881196707502],[-63.66639715349993,47.18482008797388],[-148.04139715349993,47.18482008797388],[-148.04139715349993,30.214881196707502]]]},
                    'Alaska':{"geodesic": false,"type": "Polygon","coordinates": [[[-168.91542059099993, 71.62680009186087],
        [-168.91542059099993, 52.67867842404269],
        [-129.54042059099993, 52.67867842404269],
        [-129.54042059099993, 71.62680009186087]]]},
                    'Hawaii':{"geodesic": false,"type": "Polygon","coordinates": [[[-162.7925163471209,18.935659110261664],[-152.2511345111834,18.935659110261664],[-152.2511345111834,22.134763696750557],[-162.7925163471209,22.134763696750557],[-162.7925163471209,18.935659110261664]]]},
                    'Puerto-Rico':{"geodesic": false,"type": "Polygon","coordinates": [[[-67.98169635150003,17.751237971831113],[-65.34635089251566,17.751237971831113],[-65.34635089251566,18.532938160084615],[-67.98169635150003,18.532938160084615],[-67.98169635150003,17.751237971831113]]]},
                    'R4':{
  "geodesic": false,
  "type": "Polygon",
  "coordinates": [
    [
      [
        -120.14785145677105,
        35.00187373433839
      ],
      [
        -108.8802160007048,
        35.00187373433839
      ],
      [
        -108.8802160007048,
        45.70613418897154
      ],
      [
        -120.14785145677105,
        45.70613418897154
      ],
      [
        -120.14785145677105,
        35.00187373433839
      ]
    ]
  ]
}
         }
/*Initialize a bunch of variables*/
var toExport;
var exportArea;
var taskCount = 0;//Keeping track of the number of export tasks each session submitted
var canAddToMap = true;//Set whether addToMap function can add to the map
var canExport = false;//Set whether exports are allowed
var colorRampIndex = 1;
var NEXT_LAYER_ID = 1;var layerChildID = 0;
var layerCount = 0;var refreshNumber = 0;
var uri;var uriName;var csvName;var dataTable;var chartOptions;var infowindow;var queryGeoJSON;var marker;var mtbsSummaryMethod;


var selectedFeaturesJSON = {};
var selectionUNID = 1;


var outputURL;
var tableConverter = null;
var groundOverlayOn = false;

var chartIncludeDate = true;var chartCollection;var pixelChartCollections = {};var whichPixelChartCollection;var areaChartCollections = {};var whichAreaChartCollection;var queryClassDict = {};var exportImage;var exportVizParams;var eeBoundsPoly;var shapesMap;
var mouseLat;var mouseLng; var area = 0;var distance = 0;var areaPolygon; var markerList = [];var distancePolylineT;var clickCoords;var distanceUpdater;
var updateArea;var updateDistance;var areaPolygonObj = {};var udpPolygonObj = {};var udpPolygonNumber = 1;var mapHammer;var chartMTBS;var chartMTBSByNLCD;var chartMTBSByAspect;
var walkThroughAdded = false;
var distancePolyline;
var distancePolylineOptions = {
              strokeColor: '#FF0',
              icons: [{
                icon:  {
              path: 'M 0,-1 0,1',
              strokeOpacity: 1,
              scale: 4
            },
                offset: '0',
                repeat: '20px'
              }],
              strokeOpacity: 0,
              strokeWeight: 3,
              draggable: true,
              editable: true,
              geodesic:true
            };

var polyNumber = 1;
var polyOn = false;


var areaPolygonOptions = {
              strokeColor:'#FF0',
                fillOpacity:0.2,
              strokeOpacity: 1,
              strokeWeight: 3,
              draggable: true,
              editable: true,
              geodesic:true,
              polyNumber: polyNumber
            
            };

var userDefinedI = 1;

var udpOptions = {
          strokeColor:'#FF0',
            fillOpacity:0.2,
          strokeOpacity: 1,
          strokeWeight: 3,
          draggable: true,
          editable: true,
          geodesic:true,
          polyNumber: 1
        };
var exportAreaPolylineOptions = {
          strokeColor:'#FF0',
            fillOpacity:0.2,
          strokeOpacity: 1,
          strokeWeight: 3,
          draggable: true,
          editable: true,
          geodesic:true,
          polyNumber: 1
        };
var exportAreaPolygonOptions = {
          strokeColor:'#FF0',
            fillOpacity:0.2,
          strokeOpacity: 1,
          strokeWeight: 3,
          draggable: false,
          editable: false,
          geodesic:true,
          polyNumber: 1
        };
var exportImageDict = {};
var canExport = false;
var featureObj = {};var geeRunID;var outstandingGEERequests = 0;var geeTileLayersDownloading = 0;

var plotDictID = 1;
var exportID = 1;


var unitMultiplierDict = {imperial:
{area:[10.7639,0.000247105],distance:[3.28084,0.000621371]},
metric:
{area:[1,0.0001],distance:[1,0.001]}};

var unitNameDict = {imperial:
{area:['ft<sup>2</sup>','acres'],distance:['ft','miles']},
metric:
{area:['m<sup>2</sup>','hectares'],distance:['m','km']}};


//Chart variables
var plotRadius = 15;
var plotScale = 30;
var areaChartFormat = 'Percentage';
var areaChartFormatDict = {'Percentage': {'mult':100,'label':'% Area'}, 'Acres': {'mult':0.000247105,'label':'Acres'}, 'Hectares': {'mult':0.0001,'label':'Hectares'}};

var areaGeoJson;
var areaChartingCount = 0;
var center;var globalChartValues;



//Chart color properties
var chartColorI = 0;
var chartColorsDict = {
  'standard':['#050','#0A0','#e6194B','#14d4f4'],
  'advanced':['#050','#0A0','#9A6324','#6f6f6f','#e6194B','#14d4f4'],
  'advancedBeta':['#050','#0A0','#9A6324','#6f6f6f','#e6194B','#14d4f4','#808','#f58231'],
  'coreLossGain':['#050','#0A0','#e6194B','#14d4f4'],
  'allLossGain':['#050','#0A0','#e6194B','#808','#f58231','#14d4f4'],
  'test':['#9A6324','#6f6f6f','#e6194B','#14d4f4','#880088','#f58231'],
  'testArea':['#e6194B','#14d4f4','#880088','#f58231'],
  'ancillary':['#cc0066','#660033','#9933ff','#330080','#ff3300','#47d147','#00cc99','#ff9966','#b37700']
  }

var chartColors = chartColorsDict.standard;


//Dictionary of zoom level map scales
var zoomDict = {20 : '1,128.49',
                19 : '2,256.99',
                18 : '4,513.98',
                17 : '9,027.97',
                16 : '18,055.95',
                15 : '36,111.91',
                14 : '72,223.82',
                13 : '144,447.64',
                12 : '288,895.28',
                11 : '577,790.57',
                10 : '1,155,581.15',
                9  : '2,311,162.30',
                8  : '4,622,324.61',
                7  : '9,244,649.22',
                6  : '18,489,298.45',
                5  : '36,978,596.91',
                4  : '73,957,193.82',
                3  : '147,914,387.60',
                2  : '295,828,775.30',
                1  : '591,657,550.50'}


var authProxyAPIURL = "https://rcr-ee-proxy-2.herokuapp.com";
// var geeAPIURL = "https://earthengine.googleapis.com/map";
// var geeAPIURL = "https://earthengine.googleapis.com/map";
var geeAPIURL = "https://earthengine.googleapis.com";
// https://earthengine.googleapis.com/v1alpha/projects/earthengine-legacy/maps/
// var widgetsOn = true;
// var layersOn = true;
// var legendOn = true;
// var chartingOn = false;
// var distanceOn = false;
// var areaOn = false;
// var drawing = false;
var plotsOn = false;
// var helpOn = false;
// var queryOn = false;
// var areaChartingOn = false;
// var studyAreaName = 'BTNF'

/////////////////////////////////////////////////////
//Taken from: https://stackoverflow.com/questions/1669190/find-the-min-max-element-of-an-array-in-javascript
Array.prototype.max = function() {
  return Math.max.apply(null, this);
};

Array.prototype.min = function() {
  return Math.min.apply(null, this);
};
/////////////////////////////////////////////////////
//Taken from: https://stackoverflow.com/questions/196972/convert-string-to-title-case-with-javascript/6475125
String.prototype.toProperCase = function () {
    return this.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
};
/////////////////////////////////////////////////////
//Taken from: https://stackoverflow.com/questions/2116558/fastest-method-to-replace-all-instances-of-a-character-in-a-string
String.prototype.replaceAll = function(str1, str2, ignore) 
{
    return this.replace(new RegExp(str1.replace(/([\/\,\!\\\^\$\{\}\[\]\(\)\.\*\+\?\|\<\>\-\&])/g,"\\$&"),(ignore?"gi":"g")),(typeof(str2)=="string")?str2.replace(/\$/g,"$$$$"):str2);
} 

Number.prototype.formatNumber = function(n){
  if(n === undefined || n === null){n = 2}
  return this.toFixed(n).replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,")
}