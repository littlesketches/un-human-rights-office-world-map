//////////////////////////////////////////////////////////////////////////////////////////////
////   Interactive Map for UN Office of the High Commissioner for Human Rights (OHCHR)    ////
////   Designed and made by Little SKetches www.littlesketch.es and provided under CC3.0  ////
////   Acknowledgements, credits and thanks for helpful code snippets are in comments :)  ////
//////////////////////////////////////////////////////////////////////////////////////////////

/////////////////////////
/// Helper functions  ///
/////////////////////////

  Array.prototype.contains = function ( needle ) {
     for (i in this) {
         if (this[i] == needle) return true;
     }
     return false;
    };

  Array.prototype.unique = function() {
    return this.reduce(function(accum, current) {
        if (accum.indexOf(current) < 0) {
            accum.push(current);
        }
        return accum;
      }, []);
    };

  function findWithAttr(array, attr, value) {
      for(var i = 0; i < array.length; i += 1) {
          if(array[i][attr] === value) {return i;}
      }
      return -1;
    };
  var nthWord = function(str, n) {
      var m = str.match(new RegExp('^(?:\\w+\\W+){' + --n + '}(\\w+)'));
      return m && m[1];
    };


///////////////////////////////////
/// Settings for map on start   ///
///////////////////////////////////

   //  Sets map to be rolled left on startup
   d3.select('#perspective').classed('modalview animate',false)       

    // variables for screen inititilisation variables 
    var projectionName = 'Eckert IV',                       // Default projection
        defaultRotation = "Uninterupted SIDS world",           // Default rotation
        defaultZoom;                                        // Default zoom for focus


/////////////////////////////////////////////
/// Colour pallettes for scripted styling ///
/////////////////////////////////////////////

  //Main Colours
  var hexBlue = "#5B92E5" ;                   // UN Blue
  var hexOrange = "#5B92E5";                  // Fund Orange

  var rgbaBlue = "rgba(91,146,229, 1)";       // UN Blue
  var rgbaOrange = "rgba(91,146,229, 1)";     // Fund Orange

  //Secondary pallette
  var rgbaOrange = "rgba(246, 151, 59, 1)";   // Africa
  var rgbaBlueGr = "rgba(28, 172, 203, 1)";   // Carribean & Latin America
  var rgbaGreen = "rgba(28, 172, 203, 1)";    // Asia & the Pacific

  // Country pallettes. Note: general country styling is performed via CSS. These are matched to enable styling of scripted elements                        
  var ldcColour = "#ff7f2a";
  var sidsColour = "#7f2aff";
  var ldcsidsColour = "#c87137";
  var donorColour = "#FFF589";
  var otherCountriesColour = "#FFF";
  // var lightOcean = 'rgb(96,179,171)';
  var lightOcean = '#B2DFEE';

  // Palette options and settings for background (ocean). 
  var darkPalette =["rgb(30, 30, 30)", "#fff"];   // [Ocean colour, Graticule colour]
  // var lightPalette =['#B2DFEE', "#fff"]; 
  var lightPalette =[lightOcean, "#fff"]; 

  var paletteOptions = ['Light', 'Dark'];       // Setting options for ocean
  var mapPalette = lightPalette;                // Setting options for ocean

  // Other elements colours and options
  var genevaColour = "#5B92E5";                  // UN Blue
  var hatch = "#FFF", hatchStrokeWidth = 0.5;    // Hatching for non-beneficiary countries


/////////////////////////////////
/// Code for intearctive map  ///
/////////////////////////////////

  // Set global variables
    var countries, countryData, projection, path, svg, g, defs, projectionOptions, currentProjectionIndex, 
        listCounter = 0;                                // List counter to enable escape from animated tours

    var c = document.getElementById('mapContainer');
    var width = c.offsetWidth,
        aspect = 0.5,                                     
        height = width * aspect;

    // Map projections settings and options
    var geneva = [6.143158, 46.204391],                     // Coordinates for Geneva to enable option for centering Geneva on map
        noRotation = [0,0],
        islandRotation = [-40,0],                           // Offset to keep grouping of SIDS on right hand side of 2D projections (i.e. without splitting islands on left and right)
        americanRotation = [57.5,0],                         // Offset to place Central America in the centre of the map. A zoom function is called when this is selected
        rotationOptions = ["Greenwich meridian world", "Uninterupted SIDS world", "Geneva centered world","Caribbean & Latin America focus"], 
        rotationArray = [noRotation, islandRotation , genevaCentered(), americanRotation],
        modelRotation = rotationArray[rotationOptions.indexOf(defaultRotation)];          // Set model rotation based on rotation option

    var graticule = d3.geoGraticule();                      // Define graticule path projection

    // variables for selection of element to apply zoom
    var zoom = d3.zoom().scaleExtent([1, 10]).on("zoom", move);  

    // variables for selections for tooltips
    var offsetL = c.offsetLeft + 10,                          // Offsets position of tooltip relative to cursor 
        offsetT = c.offsetTop + 0 ;  

    // variables and div setup for country info toolip (displayed on hover)
    var tooltipCountryHover = d3.select("#mapContainer").append("div").attr("class", "tooltip tooltipCountryHover hidden");
        d3.select('.tooltipCountryHover').insert("br")

    // variables and div setup for Geneva info toolip (displayed on hover)
    var tooltipGenevaHover = d3.select("#mapContainer").append("div").attr("class", "tooltip tooltipGenevaHover hidden")
        d3.select('.tooltipGenevaHover').insert("br")

  // Initiate setup for map dimensions in browser, projection and responsiveness 
      setup(width, height, projectionName, modelRotation);
      d3.select(window).on("resize", throttle);

      // Sets map dimensions, elements for zoom and pan, and projection used 
        function setup(width, height, projectionName, modelRotation){
          svg = d3.select("#mapContainer").append("svg")        //Setup SVG canvas
              .attr("width", width)
              .attr("height", height)
              .call(zoom)
          setHatching();                                        //Adds overlay of hatching for non-beneficiary nations
          g = svg.append("g")                                   
              .attr("id","zoomGroup")
              .on(clickevent, click);                           //Adds group for zoom and click event function (note: clickevent is either onClick or touchStart, depending on device detection)
          projection = setProjection(projectionName, modelRotation);    
        };

      // Attaches svg hatch styling for non-beneficiaries
        function setHatching(){
          defs = svg.append("defs")
          defs.append('pattern')
            .attr('id','nonBen')
            .attr('patternUnits', 'userSpaceOnUse')
            .attr('width', 2)
            .attr('height', 2)
              .append("path") 
                .attr("d", "M-0.5,0.5 l1,-1 M0,2 l2,-2 M1.5,2.5 l1,-1")
                .attr("stroke", hatch)
                .attr("stroke-width", hatchStrokeWidth);

          // Alternative hatching method to apply striped mask to a coloured fill instead of overlay of white stripes. Note: this results in coloured stripes on clear fill
            /* defs.append('mask')
               .attr('id','stripeMask')
               .append('rect')
                 .attr('height', '100%')
                 .attr('width', '100%')
                 .style('fill', 'url(#nonBen)') */
          };

      // Scale and set projection and rotation (as functions to enable resizing)
        function scaleProjection(rotation){
          projectionOptions = [
              {name: "Airy", projection: d3.geoAiry().translate([(width/2), (height*0.5)]).scale( width *0.45 / Math.PI).rotate(rotation)},
              {name: "Aitoff", projection: d3.geoAitoff().translate([(width/2), (height*0.5)]).scale( width / 2 / Math.PI).rotate(rotation)},
              {name: "Albers", projection: d3.geoAlbers().parallels([20, 50]).translate([(width/2), (height*0.57)]).scale( width *0.47 / Math.PI).rotate(rotation)},
              {name: "Armadillo", projection: d3.geoArmadillo().translate([(width/2), (height*0.5)]).scale( width * 0.65 / Math.PI).rotate(rotation)},
              {name: "August", projection: d3.geoAugust().translate([(width/2), (height*0.5)]).scale( width * 0.3 / Math.PI).rotate(rotation)},
              {name: "Baker", projection: d3.geoBaker().translate([(width/2), (height*0.5)]).scale( width / 2 / Math.PI).rotate(rotation)},
              {name: "Berghaus", projection: d3.geoBerghaus().translate([(width/2), (height*0.5)]).scale( width *0.27 / Math.PI).rotate(rotation)},
              {name: "Boggs", projection: d3.geoBoggs().translate([(width/2), (height*0.5)]).scale( width *0.52 / Math.PI).rotate(rotation)},
              {name: "Bonne", projection: d3.geoBonne().translate([(width/2), (height*0.5)]).scale( width *0.38 / Math.PI).rotate(rotation)},
              {name: "Bottomley", projection: d3.geoBottomley().translate([(width/2), (height*0.5)]).scale( width / 2 / Math.PI).rotate(rotation)},
              {name: "Bromley", projection: d3.geoBromley().translate([(width/2), (height*0.5)]).scale( width / 2 / Math.PI).rotate(rotation)},
              {name: "Collignon", projection: d3.geoCollignon().translate([(width/2), (height*0.5)]).scale( width *0.35 / Math.PI).rotate(rotation)},
              {name: "Craster Parabolic", projection: d3.geoCraster().translate([(width/2), (height*0.5)]).scale( width / 2 / Math.PI).rotate(rotation)},
              {name: "Cylindrical", projection: d3.geoCylindricalEqualArea().translate([(width/2), (height*0.52)]).scale( width *0.65 / Math.PI).rotate(rotation)},
              {name: "Eckert I", projection: d3.geoEckert1().translate([(width/2), (height*0.5)]).scale( width * 0.54 / Math.PI).rotate(rotation)},
              {name: "Eckert II", projection: d3.geoEckert2().translate([(width/2), (height*0.5)]).scale( width * 0.54 / Math.PI).rotate(rotation)},
              {name: "Eckert III", projection: d3.geoEckert3().translate([(width/2), (height*0.5)]).scale( width * 0.59 / Math.PI).rotate(rotation)},
              {name: "Eckert IV", projection: d3.geoEckert4().translate([(width/2), (height*0.5)]).scale( width * 0.59 / Math.PI).rotate(rotation)},
              {name: "Eckert V", projection: d3.geoEckert5().translate([(width/2), (height*0.5)]).scale( width * 0.56  / Math.PI).rotate(rotation)},
              {name: "Eckert VI", projection: d3.geoEckert6().translate([(width/2), (height*0.5)]).scale( width * 0.56  / Math.PI).rotate(rotation)},
              {name: "Eisenlohr", projection: d3.geoEisenlohr().translate([(width/2), (height*0.5)]).scale( width * 0.25  / Math.PI).rotate(rotation)},
              {name: "Equirectangular (Plate Carrée)", projection: d3.geoEquirectangular().translate([(width/2), (height*0.5)]).scale( width / 2 / Math.PI).rotate(rotation)},
              {name: "Fahey", projection: d3.geoFahey().translate([(width/2), (height*0.5)]).scale( width *0.55 / Math.PI).rotate(rotation)},
              {name: "Gall-Peters", projection: d3.geoCylindricalEqualArea().parallel(45).translate([(width/2), (height*0.52)]).scale( width *0.65 / Math.PI).rotate(rotation)},
              {name: "Gingery", projection: d3.geoGingery().translate([(width/2), (height*0.5)]).scale( width *0.285 / Math.PI).rotate(rotation)},
              {name: "Ginzburg IV", projection: d3.geoGinzburg4().translate([(width/2), (height*0.5)]).scale( width *0.47 / Math.PI).rotate(rotation)},
              {name: "Ginzburg V", projection: d3.geoGinzburg5().translate([(width/2), (height*0.5)]).scale( width *0.48 / Math.PI).rotate(rotation)},
              {name: "Ginzburg VI", projection: d3.geoGinzburg6().translate([(width/2), (height*0.5)]).scale( width *0.41 / Math.PI).rotate(rotation)},
              {name: "Ginzburg VIII", projection: d3.geoGinzburg8().translate([(width/2), (height*0.5)]).scale( width *0.55 / Math.PI).rotate(rotation)},
              {name: "Ginzburg IX", projection: d3.geoGinzburg9().translate([(width/2), (height*0.5)]).scale( width *0.41 / Math.PI).rotate(rotation)},
              {name: "Gringorten", projection: d3.geoGringorten().translate([(width/2), (height*0.5)]).scale( width *0.80 / Math.PI).rotate(rotation)},
              {name: "Guyou", projection: d3.geoGuyou().translate([(width/2), (height*0.5)]).scale( width *0.5 / Math.PI).rotate(rotation)},
              {name: "Hammer", projection: d3.geoHammer().translate([(width/2), (height*0.5)]).scale( width * 0.55 / Math.PI).rotate(rotation)},
              {name: "Hammer Retro", projection: d3.geoHammerRetroazimuthal().translate([(width/2), (height*0.5)]).scale( width * 0.25 / Math.PI).rotate(rotation)},
              {name: "HEAL Pix", projection: d3.geoHealpix().translate([(width/2), (height*0.5)]).scale( width *0.78 / Math.PI).rotate(rotation)},
              {name: "Hill", projection: d3.geoHill().translate([(width/2), (height*0.5)]).scale( width *0.53 / Math.PI).rotate(rotation)},
              {name: "Homolosine (Goode)", projection: d3.geoHomolosine().translate([(width/2), (height*0.5)]).scale( width / 2 / Math.PI).rotate(rotation)},
              {name: "Kavrayskiy VII", projection: d3.geoKavrayskiy7().translate([(width/2), (height*0.5)]).scale( width * 0.53  / Math.PI).rotate(rotation)},
              {name: "Lambert Azimuthal", projection: d3.geoAzimuthalEqualArea().translate([(width/2), (height*0.5)]).scale( width * 0.39 / Math.PI).rotate(rotation)},
              {name: "Lambert cylindrical equal-area", projection: d3.geoCylindricalEqualArea().translate([(width/2), (height*0.52)]).scale( width * 0.64 / Math.PI).rotate(rotation)},
              {name: "Lagrange", projection: d3.geoLagrange().translate([(width/2), (height*0.5)]).scale( width *0.78 / Math.PI).rotate(rotation)},
              {name: "Larrivée", projection: d3.geoLarrivee().translate([(width/2), (height*0.5)]).scale( width *0.5 / Math.PI).rotate(rotation)},
              {name: "Laskowski", projection: d3.geoLaskowski().translate([(width/2), (height*0.5)]).scale( width *0.44 / Math.PI).rotate(rotation)},
              {name: "Loximuthal", projection: d3.geoLoximuthal().translate([(width/2), (height*0.5)]).scale( width / 2 / Math.PI).rotate(rotation)},
              {name: "Mercator", projection: d3.geoMercator().translate([(width/2), (height*0.58)]).scale( width / 2 / Math.PI).rotate(rotation)},
              {name: "Miller", projection: d3.geoMiller().scale(100).translate([(width/2), (height*0.6)]).scale( width / 2 / Math.PI).rotate(rotation)},
              {name: "McBryde–Thomas Flat-Polar Parabolic", projection: d3.geoMtFlatPolarParabolic().translate([(width/2), (height*0.5)]).scale( width *0.53 / Math.PI).rotate(rotation)},
              {name: "McBryde–Thomas Flat-Polar Quartic", projection: d3.geoMtFlatPolarQuartic().translate([(width/2), (height*0.5)]).scale( width *0.60 / Math.PI).rotate(rotation)},
              {name: "McBryde–Thomas Flat-Polar Sinusoidal", projection: d3.geoMtFlatPolarSinusoidal().translate([(width/2), (height*0.5)]).scale( width *0.54 / Math.PI).rotate(rotation)},
              {name: "Mollweide", projection: d3.geoMollweide().translate([(width/2), (height*0.5)]).scale( width *0.55 / Math.PI).rotate(rotation)},
              {name: "Natural Earth", projection: d3.geoNaturalEarth().translate([(width/2), (height*0.5)]).scale( width *0.55 / Math.PI).rotate(rotation)},
              {name: "Natural Earth II", projection: d3.geoNaturalEarth2().translate([(width/2), (height*0.5)]).scale( width *0.55 / Math.PI).rotate(rotation)},
              {name: "Nell–Hammer", projection: d3.geoNellHammer().translate([(width/2), (height*0.5)]).scale( width / 2 / Math.PI).rotate(rotation)},
              {name: "Patterson", projection: d3.geoPatterson().translate([(width/2), (height*0.55)]).scale( width *0.5 / Math.PI).rotate(rotation)},
              {name: "Polyconic", projection: d3.geoPolyconic().translate([(width/2), (height*0.5)]).scale( width *0.32 / Math.PI).rotate(rotation)},
              {name: "Rectangular Polyconic", projection: d3.geoRectangularPolyconic().translate([(width/2), (height*0.5)]).scale( width *0.41 / Math.PI).rotate(rotation)},
              {name: "Robinson", projection: d3.geoRobinson().translate([(width/2), (height*0.5)]).scale( width / 2 / Math.PI).rotate(rotation)},
              {name: "Sinusoidal", projection: d3.geoSinusoidal().translate([(width/2), (height*0.5)]).scale( width / 2 / Math.PI).rotate(rotation)},
              {name: "Sinu-Mollweide", projection: d3.geoSinuMollweide().translate([(width/2), (height*0.5)]).scale( width *0.51 / Math.PI).rotate(rotation)},
              {name: "Stereographic", projection: d3.geoStereographic().translate([(width/2), (height*0.5)]).scale( width *0.3 / Math.PI).rotate(rotation)},
              {name: "Stereographic Modified", projection: d3.geoModifiedStereographicLee().translate([(width/2), (height*0.5)]).scale( width *0.2 / Math.PI)},
              {name: "Transverse Mercator", projection: d3.geoTransverseMercator().translate([(width/2), (height*0.5)]).scale( width *0.35 / Math.PI).clipAngle(90).rotate(rotation)},
              {name: "van der Grinten", projection: d3.geoVanDerGrinten().translate([(width/2), (height*0.5)]).scale( width *0.45 / Math.PI).rotate(rotation)},
              {name: "van der Grinten II", projection: d3.geoVanDerGrinten2().translate([(width/2), (height*0.5)]).scale( width *0.45 / Math.PI).rotate(rotation)},
              {name: "van der Grinten IV", projection: d3.geoVanDerGrinten4().translate([(width/2), (height*0.5)]).scale( width *0.41 / Math.PI).rotate(rotation)},
              {name: "Wagner IV", projection: d3.geoWagner4().translate([(width/2), (height*0.5)]).scale( width * 0.57 / Math.PI).rotate(rotation)},
              {name: "Wagner VI", projection: d3.geoWagner6().translate([(width/2), (height*0.5)]).scale( width / 2 / Math.PI).rotate(rotation)},
              {name: "Wagner VII", projection: d3.geoWagner7().translate([(width/2), (height*0.5)]).scale( width *0.54 / Math.PI).rotate(rotation)},
              {name: "Werner", projection: d3.geoBonne().translate([(width/2), (height*0.5)]).scale( width *0.38 / Math.PI).rotate(rotation).parallel(90).precision(0.2).center([0, 27])},
              {name: "Winkel Tripel", projection: d3.geoWinkel3().translate([(width/2), (height*0.5)]).scale( width *0.55 / Math.PI).rotate(rotation)},
              {name: "Interrupted Homolosine", projection: d3.geoInterruptedHomolosine().translate([(width/2), (height*0.5)]).scale( width *0.5 / Math.PI).rotate(rotation)},
              {name: "Interrupted Sinusoidal", projection: d3.geoInterruptedSinusoidal().translate([(width/2), (height*0.5)]).scale( width *0.5 / Math.PI)},
              {name: "Interrupted Boggs", projection: d3.geoInterruptedBoggs().translate([(width/2), (height*0.5)]).scale( width *0.52 / Math.PI).rotate(rotation)},
              // {name: "Interrupted Sinu-Mollweide", projection: d3.geoInterruptedSinuMollweide().scale( width *0.5 / Math.PI).translate([(width/2), (height*0.5)]).precision(.1)},
              {name: "Interrupted Mollweide", projection: d3.geoInterruptedMollweide().translate([(width/2), (height*0.5)]).scale( width *0.5 / Math.PI).rotate(rotation)},
              {name: "Interrupted Mollweide Hemispheres", projection: d3.geoInterruptedMollweideHemispheres().translate([(width/2), (height*0.5)]).scale( width *0.5 / Math.PI).rotate(rotation)},
              {name: "Polyhedral Butterfly", projection: d3.geoPolyhedralButterfly().translate([(width/2), (height*0.5)]).scale( width *0.32 / Math.PI).rotate(rotation)},
              {name: "Polyhedral Collignon", projection: d3.geoPolyhedralCollignon().translate([(width/2), (height*0.5)]).scale( width *0.38 / Math.PI).rotate(rotation)},
              {name: "Polyhedral Waterman", projection: d3.geoPolyhedralWaterman().translate([(width/2), (height*0.5)]).scale( width *0.35 / Math.PI).rotate(rotation)},
              {name: "Quincuncial Gringorten", projection: d3.geoGringortenQuincuncial().translate([(width/2), (height*0.5)]).scale( width *0.55 / Math.PI).clipAngle(90 - 1e-6).precision(.01)},
              {name: "Quincuncial Pierce", projection: d3.geoPeirceQuincuncial().translate([(width/2), (height*0.5)]).scale( width *0.5 / Math.PI).clipAngle(90 - 1e-6).precision(.01)},
              {name: "Pierce Equitorial", projection: d3.geoPeirceQuincuncial().translate([(width/2), (height*0.5)]).scale( width *0.5 / Math.PI).clipAngle(90 - 1e-6).precision(.01).rotate([0, 0, 45])},
              {name: "Orthoghraphic", projection: d3.geoOrthographic().translate([(width/2), (height*0.5)]).scale( width *0.8 / Math.PI).clipAngle(90).precision(.1)}
            ];
          };

        function setProjection(projectionName, rotation){
            scaleProjection(modelRotation);                                                       // Update projection options to scale for screen size (changes)
            currentProjectionIndex = findWithAttr(projectionOptions, 'name', projectionName);     // Calls helper funciton to find index in array
            projection = projectionOptions[currentProjectionIndex].projection;
            projectionName = projectionOptions[currentProjectionIndex].name;
            return projection;                                                                    // Return projection name for redraw
           };

        function genevaCentered(){
          var radialProjections = ["Gingery", "Orthoghraphic"];                                   // List of projections where it makes sense to center Geneva on longitude and latitude (i.e. radial-type projections)
          if (radialProjections.contains(projectionName)){return [-geneva[0] ,-geneva[1]];};      // Check for radial projection and center on long and lat and return array for rotation
          return [-geneva[0] , 0];                                                                // Otherwise center on Geneva longitude only for rotaion and zero for latitude (suits most projects where hemispheres) 
          };

  // Read in geo data and LIDs/SIDs 'data.csv' (assigned to countryData) and calls function to draw map
    d3.queue()    
      .defer(d3.json, "data/countries.geojson")
      .defer(d3.tsv, "data/data.txt")
      .await(drawMap)
    
  ///////////////////
  // Draw the map! //
  ///////////////////

  // Parse geographic and SIDS/LDC data and pass to draw function
    function drawMap(error, geoData, dataUN){ 
        if (error) throw error;
        draw(geoData, dataUN) 
        };
  
  // Draw country shapes from geojson data and add classes from country data. Note: TopoJson is possible, however geo file is relatively small and more amenable to client updating
    function draw(geoData, dataUN) {
      countries = geoData;                              // pass geodata to global variable for recomputation on resize
      countryData = dataUN;                             // pass country data to global variable for recomputation on resize

      path = d3.geoPath().projection(projection);       // map all paths to chosen projection

      d3.select("defs")                                 // adds clip path of projection outline to SVG defs for clipping
        .append("path")
          .datum({type: "Sphere"})
          .attr("id", "sphere")
          .attr("d", path);
        d3.select("defs")
          .append("clipPath")
            .attr("id", "clip")
              .append("use")
              .attr("xlink:href", "#sphere");

      var zoomGroup = d3.select("#zoomGroup");          // selection of SVG group element to add graticules and country paths
        // Draw graticules and outline
        zoomGroup.append("path")                        // add graticule outline first to style as ocean fill
          .datum(graticule.outline)
            .attr("class", "graticule outline")
            .attr("d", path)
            .style('fill',mapPalette[0])
        zoomGroup.append("path")                        // add graticules beneath countries
          .datum(graticule)
            .attr("class", "graticule line")
            .attr("d", path)
            .style('stroke',mapPalette[1])
            .style('stroke-width', 0.5);      

        //Draw of country paths and attach classes from country data for styling
        zoomGroup.selectAll("path.country")             // draw countries with name as ID and call tooltip hover behaviour
          .data(countries.features).enter().insert("path")
            .attr("id", function(d,i){return countries.features[i]["properties"]["name"].replace(/\s|\.+/g, '') })  
            .classed("country", true)
            .style('fill',mapPalette[2])
            .attr("d", path)
              .on("mouseover", countryMouseOver)        // Add hover interactivity          
              .on("mouseout", countryMouseOut);

         d3.selectAll(".country")                       // add user-defined LDC, SIDS and Donor etc. classes to countries
           .data(countryData)
           .attr('class', function(d) { return d.ldcClass+" "+d.sidsClass+" "+d.islandClass+" "+d.donorClass+" "+d.beneficiary+" "+d.region.replace(/\s|\.+/g, '')+" "+d.subRegion.replace(/\s|\.+/g, '')+' country'}) ;

        // Draw overlay of countries (i.e. a repeated layed) to render hatching for non-benficiary LDC/SIDS       
        zoomGroup.selectAll(".overlay")                         
          .data(countries.features).enter().insert("path")
            .attr("id", function(d,i){return countries.features[i]["properties"]["name"]+"Overlay" })  
           .attr("class", "overlay") 
           .attr("d", path)        
           .attr("stroke", "none")

         d3.selectAll(".overlay")                    // Adds beneficiary/non-beficiary class and makes overlay countries invisible   
           .data(countryData) 
           .attr("class", function(d) { return d.beneficiary+" overlay"}) 
           .attr("fill", 'none');

         d3.selectAll(".non-beneficiary.overlay")     // Attaches hatching fill for non-beneficiaries only
           .attr("fill", 'url(#nonBen)');

        // Draw star Geneva marker and translated to center on Geneva coordinates
        zoomGroup.append("path")
          .attr('id', 'genevaMarker')
          .attr('d', 'M24.275 38.042L9.902 45.33l2.63-15.79L1.5 17.796l15.69-2.43L24.68 1.5l7.29 13.97L47.657 18.2 36.524 29.235 38.75 45.43z')
              .on("mouseover", genevaMouseOver)
              .on("mouseout", genevaMouseOut);

          var genevaStarSVGWidth  = d3.select('#genevaMarker').node().getBBox().width;
          var genevaStarTargetWidth  = 10;

          d3.select('#genevaMarker')
            .attr('transform', 'translate('+(projection(geneva)[0] )+','+(projection(geneva)[1] - genevaStarTargetWidth/2)+')scale('+genevaStarTargetWidth / genevaStarSVGWidth+')')

        // Add clip path of the projection outline to cleanly render interrupted projections
        zoomGroup.attr("clip-path", "url(#clip)")   

        // Add on-click interactivity for donor and beneficiary countries
        d3.selectAll('.donor').classed('reveal', true).on(clickevent, donorClick);
        d3.selectAll('.beneficiary').classed('reveal', true).on(clickevent, beneficiaryClick);
        init();                              // adds newly classed 'reveal elements to infopage functionality' 

        if(listCounter===0){createTourLists(); listCounter=1;}

        // Calculate gender metrics
        genderBreakdown();
      };

    // Redraw function to render map on changes to browser window size, and changes to projection/rotation options
    function redraw() {             
      width = c.offsetWidth;                //reset width  
      height = width * aspect;              //reset height
      d3.select('svg').remove();            //clears the current canvas
      rotationArray = [noRotation, islandRotation , genevaCentered(), americanRotation]                   
      setup(width, height, projectionName, modelRotation); 
      draw(countries, countryData); 
      if(modelRotation===americanRotation){zoomToArea(-width*1.2,-height*0.9,3.75)};
      };

  // Country Mouseover/out functionality - Tooltips and flags responsiveness
    function countryMouseOver(){
      var mouse = d3.mouse(svg.node()).map( function(d) { return parseInt(d); } ); // Detect mouse position

      // Render tooltip div poistion and add country as title
      tooltipCountryHover.classed("hidden", false)
        .attr("style", "left:"+(mouse[0]+offsetL)+"px;top:"+(mouse[1]+offsetT)+"px")
        .html(this.__data__.name)
      d3.select('.tooltipCountryHover').insert("br");

      // Render flag for country tooltip (detect country and attach svg path to image)       
      var countryFlag = d3.select('.tooltipCountryHover').insert("img").attr('id', 'countryFlag');
      var countryHover = this.__data__.name;
      var countryDataIndex  = countryData.map(function(obj, index) {                //  Alternative code > var countryDataIndex = countryData.findIndex(x => x.name==countryHover);    // May not work in IE
            if(obj.name == countryHover) {return index;}
            }).filter(isFinite)

      d3.select('#countryFlag')
           .attr('src', function(d,i) {
            var iso2 = countryData[countryDataIndex]['iso2'].toLowerCase();
            return 'img/flags/'+iso2+'.svg'; });
      
      // Add country status or fade out tooltip for non-participants 
      var countryTypeText = d3.selectAll('.tooltipCountryHover')
          .insert("div")
          .attr('class', 'tooltipText')
          .html(function(){
              if (countryData[countryDataIndex]['ldcClass'] === 'ldc' && countryData[countryDataIndex]['sidsClass'] === 'sids' && countryData[countryDataIndex]['beneficiary'] === 'beneficiary'){
                  return "Tust Fund Beneficiary<br/>(LDC-SIDS)"
                } else if (countryData[countryDataIndex]['ldcClass'] === 'ldc' && countryData[countryDataIndex]['sidsClass'] === 'sids' && countryData[countryDataIndex]['non-beneficiary'] === 'non-beneficiary'){
                  return "Non-beneficiary<br/>(LDC-SIDS)"
                } else if (countryData[countryDataIndex]['ldcClass'] === 'ldc' && countryData[countryDataIndex]['beneficiary'] === 'beneficiary'){
                  return "Tust Fund Beneficiary<br/>Least Developed Country"
                } else if (countryData[countryDataIndex]['ldcClass'] === 'ldc' && countryData[countryDataIndex]['beneficiary'] === 'non-beneficiary'){
                  return "Non-beneficiary<br/>Least Developed Country"                            
                } else if (countryData[countryDataIndex]['sidsClass'] === 'sids' && countryData[countryDataIndex]['beneficiary'] === 'beneficiary'){
                  return "Tust Fund Beneficiary<br/>Small Island Developing State"
                } else if (countryData[countryDataIndex]['sidsClass'] === 'sids' && countryData[countryDataIndex]['beneficiary'] === 'non-beneficiary'){
                  return "Non-beneficiary<br/>Small Island Developing State"
                } else if (countryData[countryDataIndex]['donorClass'] === 'donor'){
                  return "Donor to the Trust Fund"
                } else{ d3.selectAll('.tooltipCountryHover').style('opacity','0.8')
                };
              });
            };

      function countryMouseOut(){
        tooltipCountryHover.classed("hidden", true);
        };

  // Geneva Mouseover/out functionality - Tooltips and flags responsiveness
      function genevaMouseOver(){
        var mouse = d3.mouse(svg.node()).map( function(d) { return parseInt(d); } ); // Detect mouse position

        // Render tooltip div position and add country as title
        tooltipGenevaHover.classed("hidden", false)
          .attr("style", "left:"+(mouse[0]+offsetL)+"px;top:"+(mouse[1]+offsetT)+"px")
            .html('Palais des Nations <br/>')
                .insert("img")                                                       // Add geneva image
                  .attr('id', 'genevaImage')
                  .attr('src', 'img/geneva.png')
          };

      function genevaMouseOut(){
        tooltipGenevaHover.classed("hidden", true);
        };

  // Handle panning and zoom within the window: modified from techslides.com
    function move() {
      var t = [d3.event.transform.x,d3.event.transform.y];
      var s = d3.event.transform.k;
      zscale = s;
      var h = height/4;

      t[0] = Math.min((width/height)  * (s - 1) , Math.max(width * (1 - s),           t[0]) );
      t[1] = Math.min(h * (s - 1) + h * s      , Math.max(height  * (1 - s) - h * s, t[1]) );

      g.attr("transform", "translate(" + t + ")scale(" + s + ")");

      d3.selectAll(".country")
        .style("stroke-width", 1 / s)
        .style("stroke-opacity",0.75);

      d3.selectAll(".island")
        .style("stroke-width", 1.5 / s)
        .style("stroke-opacity", 0.75);        

      d3.selectAll(".graticule")
        .style("stroke-width",0.5 / s) 
      };

  // Timer to refresh map on resize: attributed to http://techslides.com/d3-map-starter-kit
    var throttleTimer;
    function throttle() {
      window.clearTimeout(throttleTimer);
        throttleTimer = window.setTimeout(function() {
          redraw();
        }, 200);
      };

    // Geo translation on mouse click in map: attributed to http://techslides.com/d3-map-starter-kit
    function click() {
      var latlon = projection.invert(d3.mouse(this));
      };


//////////////////////////////////  
// Create map options dropdowns //
////////////////////////////////// 

  // Set view options menu to show on clicking options button
    d3.select('#viewOptions').transition()  
      .style('transform', 'translate('+-2*width+'px,0px)')

  var view = 0;       //set view to 0 when hidden
  function viewOptions(){
      if(view ===0){
          d3.select('#viewOptions')
            .transition()
              .duration(500)  
              .style('transform', 'translate(0px,0px)')
          view = 1;      // view options are in view        
      } else {
          d3.select('#viewOptions')
            .transition()
              .duration(500)  
              .style('transform', 'translate('+-width+'px,0px)')
          view = 0; 
        }
    };


  // Create menu for projection options
    var menuProjection = d3.select("#projection-menu")
        .on("change", changeProjection);

    menuProjection.selectAll("option")                                        // Populates projection options menu with mames from projectionOptions array
        .data(projectionOptions)
      .enter().append("option")
        .text(function(d) { return d.name; })
        .attr("id", function(d) { return 'option'+d.name.replace(/\s|\.+/g, ''); });                 

      d3.select('#option'+projectionName.replace(/\s|\.+/g, '')).attr("selected",projectionName);    // Sets the menu on load to match the default projection
        
    function changeProjection() {                                             // Sets projection and calls redraw
      projectionName = projectionOptions[this.selectedIndex].name;
      setProjection(projectionOptions[this.selectedIndex].name);
      redraw()
      };                                                                      

  // Create menu for rotation options
      var menuRotation = d3.select("#rotation-menu")                            
          .on("change", changeRotation);

      menuRotation.selectAll("option")                                          // Populates rotation options menu with mames from rotationOptions array
        .data(rotationOptions)
        .enter().append("option")
          .text(function(d,i) { return d })
          .attr("id", function(d,i) { return 'option'+d.replace(/\s|\.+/g, ''); });   

      d3.select('#option'+defaultRotation.replace(/\s|\.+/g, '')).attr("selected",defaultRotation);    // Sets the menu on load to match the default projection

      function changeRotation() {                                               // Sets projection and calls redraw
        modelRotation = rotationArray[this.selectedIndex];
        scaleProjection(modelRotation);
        redraw();
        }

  // Create menu for colour palette options
      var menuColour = d3.select("#colour-menu")                            
          .on("change", changeColour);  

      menuColour.selectAll("option")   
        .data(paletteOptions)
        .enter().append("option")
          .text(function(d,i) { return d })
          .attr("id", function(d,i) { return 'option'+d.replace(/\s|\.+/g, ''); });                 

      var colourTransition = 1000;
      var colourCounter = 0;
      function changeColour(time){

        if(colourCounter === 0){
          mapPalette = darkPalette; 
          colourCounter = 1
          d3.selectAll('path.graticule')
            .transition()
              .duration(colourTransition)
              .style('stroke',mapPalette[1])
              .style('stroke-width',0.25)
          } else if (colourCounter === 1){
          d3.selectAll('path.graticule')
            .transition()
              .duration(colourTransition)
              .style('stroke',mapPalette[1])
              .style('stroke-width',0.75)     
          mapPalette = lightPalette; colourCounter = 0}


        d3.selectAll('path.graticule.outline')
          .transition()
            .duration(colourTransition)
            .style('stroke','none')
            .style('fill',mapPalette[0])
        };


///////////////////////////////////////////  
// Code for detailed on-click info pages //
///////////////////////////////////////////

  /* Attribution, credit and thanks to Codrops and used under the MIT License
   * menu.js v1.0.0 http://www.codrops.com
   * Licensed under the MIT license. http://www.opensource.org/licenses/mit-license.php
   * Copyright 2013, Codrops http://www.codrops.com */

      function scrollY() {
        return window.pageYOffset || docElem.scrollTop;
      }

      function mobilecheck() {
        var check = false;
        (function(a){if(/(android|ipad|playbook|silk|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4)))check = true})(navigator.userAgent||navigator.vendor||window.opera);
        return check;
      }
      var  clickevent = mobilecheck() ? 'touchstart' : 'click';

      var docElem = window.document.documentElement,
        // support transitions
        support = Modernizr.csstransitions,
        // transition end event name
        transEndEventNames = {
          'WebkitTransition': 'webkitTransitionEnd',
          'MozTransition': 'transitionend',
          'OTransition': 'oTransitionEnd',
          'msTransition': 'MSTransitionEnd',
          'transition': 'transitionend'
        },
        transEndEventName = transEndEventNames[ Modernizr.prefixed( 'transition' ) ],
        docscroll = 0;
        // click event (if mobile use touchstart)


      function init() {
        var revealElements = document.querySelectorAll( '.reveal' ),
          perspectiveWrapper = document.getElementById( 'perspective' ),
          container = perspectiveWrapper.querySelector( '.container' ),
          contentWrapper = container.querySelector( '.wrapper' );

        for (var i = 0; i < revealElements.length; i += 1) {
          revealElements[i].addEventListener(clickevent, function( ev ) {
              ev.stopPropagation();
              ev.preventDefault();
              docscroll = scrollY();
              // change top of contentWrapper
              contentWrapper.style.top = docscroll * -1 + 'px';
              // mac chrome issue:
              document.body.scrollTop = document.documentElement.scrollTop = 0;
              // add modalview class
              classie.add( perspectiveWrapper, 'modalview' );
              // animate..
              setTimeout( function() { classie.add( perspectiveWrapper, 'animate' ); }, 25 );
            });
          };

        container.addEventListener( clickevent, function( ev ) {
          if( classie.has( perspectiveWrapper, 'animate') ) {
            var onEndTransFn = function( ev ) {
              if( support && ( ev.target.className !== 'container' || ev.propertyName.indexOf( 'transform' ) == -1 ) ) return;
              this.removeEventListener( transEndEventName, onEndTransFn );
              classie.remove( perspectiveWrapper, 'modalview' );
              // mac chrome issue:
              document.body.scrollTop = document.documentElement.scrollTop = docscroll;
              // change top of contentWrapper
              contentWrapper.style.top = '0px';
            };
            if( support ) {
              perspectiveWrapper.addEventListener( transEndEventName, onEndTransFn );
            } else {
              onEndTransFn.call();
            }
            classie.remove( perspectiveWrapper, 'animate' );
            if(modelRotation===americanRotation){
              zoomToArea(-width*1.2,-height*0.9,3.75)
            } else {zoomReset()}; 
            d3.selectAll('.selectedCountry').classed('selectedCountry',false);    //returns selected country to default styling
            }
          });

        perspectiveWrapper.addEventListener( clickevent, function( ev ) { return false; } );
      }

      init();


/////////////////////////////////////////////////////////////////////  
// Code for setting the infopage content: Beneficiaries and Donors //
/////////////////////////////////////////////////////////////////////

  var clickedCountry, clickedCountryIndex;
  // Set up infopage content div for use by both Beneficiary and Donor templates  
    var infoBackground = d3.select('#perspective').append("img").attr('class', 'backgroundFlag'),
        delegatePhoto = d3.select('#perspective').append("img").attr('class', 'backgroundPhoto'),
        infoPage = d3.select('#infoPage'),      
        infoSVG = d3.select('#infoPage').append('svg').attr('width','100%').attr('height','100%'),
        infoContent = infoPage.append('div').attr('id', 'infoContent').attr('class','outer-nav right vertical');
  
  // Function to clear the infopage content and reset the content holder
    function clearInfo(){   
      d3.selectAll('.backgroundFlag').remove();
      d3.selectAll('.backgroundPhoto').remove();
      infoContent.remove();
      infoBackground = d3.select('#perspective').append("img").attr('class', 'backgroundFlag'),
      delegatePhoto = d3.select('#perspective').append("img").attr('class', 'backgroundPhoto'),
      infoContent =  infoPage.append('div').attr('id', 'infoContent').attr('class','outer-nav right vertical');
      unLogo.transition().attr('opacity',0)
      };

  // Setup introduction infopage on load
  // Infopage background SVG
    var unLogo = infoSVG.attr('id','svgInfoPage')

    d3.html("img/icons/unohchrLogo.svg", loadSVG);
      function loadSVG(svgData) {
          unLogo.each(function() {
          var gParent = this;
          d3.select(svgData).selectAll("path").each(function() {
                gParent.appendChild(this.cloneNode(true))
            });
      }); };

    unLogo.attr('fill', '#FFF')
        .attr('opacity', 1)
        .attr("transform", "translate(" + width/2 + "," + height*0.1 + ")")

    // Add HTML text for intro page
    setupInfoIntro();
    function setupInfoIntro(){
      infoContent.append("h1").attr('class', 'introHeader')
          .html("Welcome to this wonderful map")
      infoContent.append("p").attr('class', 'infopageSpacerGap')
      infoContent.append("h3").attr('class', 'introSubHeader')
          .html("About the Trust Fund")
      infoContent.append("p").attr('class', 'info')
          .html("The UN Human Rights Council (HRC) established the Voluntary Technical Assistance Trust Fund to Support the Participation of Least Developed Countries (LDCs) and Small Island Developing States (SIDS) in the work of the HRC. The Fund is managed by the Human Rights Council Branch of the Office of the High Commissioner for Human Rights (OHCHR), and provides funding for various activities such as trainings, participation in Human Rights Council sessions, and fellowships.")
      infoContent.append("p").attr('class', 'infopageSpacerGap')
      infoContent.append("h3").attr('class', 'introSubHeader')
          .html("Explore the work and impact of the Trust Fund")
      infoContent.append("p").attr('class', 'info')
          .html("We've made this interactive map for you to explore how nations participate and benefit from the Trust Fund, and to share the personal stories of delegates and Fellows.")  
      infoContent.append("p").attr('class', 'info')
          .html("Click on the map to get started!")  

      unLogo.transition().duration(1000).attr('opacity',1)          
      };


    // Clear infopage when map is selected to prevent info pages from showing under map
    d3.selectAll('.container').on(clickevent, clearInfo);

  // Setup beneficiary infopage
    function beneficiaryClick(){
      clearInfo();
      unLogo.attr('opacity',0)
      d3.select(this).classed('selectedCountry',true)
      var el = this; countryZoom(el)      
      clickedCountry = this.__data__.name;
      clickedCountryIndex  = countryData.map(function(obj, index) {
            if(obj.name == clickedCountry) {return index;}
            }).filter(isFinite)

    // Set of variables and functions to extract and treat content for the beneficiary page
        /// HUMAN RIGHTS COUNCIL attendee beneficiary information 
          var countryType,              // Status of benefciciary type
              hrcMember,                    // Status of HRC 'Member since' 
              firstHRCfunded,             // Status of whether first attendance was due to the fund
              numHRCattended,               // Number of sessions attended
              allHRCAttended = [],          // Array of sessions attended by class name (i.e. hrc29 etc.) 
              hrcSessionArray = [],         // Array of sessions attended by name  number (i.e. 29th etc.) 
              hrcSessionDatesArray = [],    // Array of session dates corresponding to sessions attended 
              hrcAttendenceString,          // Text to form headline sentence on attended sessions
              hrcQuotesArray = [],          // Delegate quotes corresponding to each attended session
              hrcDelegateArray = [];        // Delegate name (with prefix) corresponding to each attended session
              hrcDelegatePositionArray = [];// Delegate position corresponding to delegate for each attended session

          // Call series of funcitons to pull and treat data into arrays for use with HTML page
              // Funciton to determine country type
              (function produceCountryType(){
                if (countryData[clickedCountryIndex]['ldcClass']=== 'ldc' && countryData[clickedCountryIndex]['sidsClass']!== 'sids'){
                      countryType = "LDC"
                  } else if  (countryData[clickedCountryIndex]['ldcClass']!== 'ldc' && countryData[clickedCountryIndex]['sidsClass']=== 'sids'){
                      countryType = "SIDS"
                  } else if  (countryData[clickedCountryIndex]['ldcClass']=== 'ldc' && countryData[clickedCountryIndex]['sidsClass']=== 'sids'){
                      countryType = "LDC-SIDS"
                  } 
                }());
              // Call funciton to determine if country is a HRC member and assign text string to 
              (function produceHRCfirstFunded(){
                  if (countryData[clickedCountryIndex]['hrcFirstThroughFund']=== 'Yes'){
                      firstHRCfunded = clickedCountry+" first particpated in a HRC Session through the Trust Fund"
                  } else {}
                }());

              (function produceHRCmember(){
                  if (countryData[clickedCountryIndex]['memberHRCsince']!==''){
                      hrcMember = countryData[clickedCountryIndex]['memberHRCsince'];
                  } else {hrcMember =''}
                }());

              (function produceHRCAttended(){
                    if (countryData[clickedCountryIndex]['hrcAllAttendedClass']!== ''){
                    allHRCAttended = countryData[clickedCountryIndex]['hrcAllAttendedClass'].split(' ');    // turn the hrcXX class names into an array
                  };
                }());
              // Call function to convert class names to session numbers 29th and populate array
              (function produceSessionArray(){  
                for(i=0;i<allHRCAttended.length; i+=1){
                        var last1 = allHRCAttended[i].slice(-1),                             
                            last2 = allHRCAttended[i].slice(-2),
                            string;
                        if (last1==='1'){string = last2+'st'} else if(last1==='2' && last2!=='12'){string = last2+'nd'} else if(last1==='3'&&last2!=='13'){string = last2+'rd'} else {string = last2+'th'};
                        hrcSessionArray.push(string);
                    };
                firstHRCattended = hrcSessionArray[0];              //  Finds the session first attended
                numHRCattended = hrcSessionArray.length;            //  Finds the number of HRC sessions attended
                }());
              // Call function to extract session dates to an array
              (function produceSessionDatesArray(){  
                for(i=0;i<allHRCAttended.length;i+=1){
                        var date = countryData[clickedCountryIndex][allHRCAttended[i]+'Dates'];
                        hrcSessionDatesArray.push(date);
                    };
                }());
              // Call function to produce sentence about attendance    
              (function produceHRCString(){
                  var el1 = 'Attended the ', // "Attended the "
                      el2 = '', // stores first/single session attendence
                      el3 = '', // stores all middle session attendence, preceded by a comma
                      el4 = '', // stores last session attendence, preceded by an 'and'
                      el5 = ''; // session(s) of the HRC

                  if(hrcSessionArray.length===0){}     
                  else if(hrcSessionArray.length===1){ 
                    el2 = hrcSessionArray[0]; el5 = ' session of the Human Rights Council';
                    hrcAttendenceString = el1+el2+el5;} 
                  else if (hrcSessionArray.length===2){
                    el2 = hrcSessionArray[0];   el4 = ' and '+hrcSessionArray[1];  el5 = ' sessions of the Human Rights Council'
                    hrcAttendenceString = el1+el2+el4+el5;}
                  else {  for(i=1;i<hrcSessionArray.length-1;i+=1){  el3 = ', '+hrcSessionArray[i]};
                    el2 = hrcSessionArray[0];   el4 = ' and '+hrcSessionArray[hrcSessionArray.length-1];  el5 = ' sessions of the Human Rights Council'
                    hrcAttendenceString = el1+el2+el3+el4+el5;}
                }()); 
              // Call function to put all attendee quotes into an array
              (function produceHRCquotes(){
                if (countryData[clickedCountryIndex]['hrcAllAttendedClass']!== ''){
                  for(i=0;i<numHRCattended;i+=1){
                    var quoteLabel = allHRCAttended[i]+'delegateQuote'; 
                    var quote = countryData[clickedCountryIndex][quoteLabel];
                    hrcQuotesArray.push(quote);
                    } 
                  };
                }());
              // Call funcion to produce array delegate name for each attended session (with gender prefix if applicable)
              (function produceHRCdelegates(){
                if (countryData[clickedCountryIndex]['hrcAllAttendedClass']!== ''){
                  for(i=0;i<numHRCattended;i+=1){
                    var authorLabel = allHRCAttended[i]+'delegateName';  
                    var authorGender = countryData[clickedCountryIndex][allHRCAttended[i]+'delegateGender']; 
                    var authorPrefix = ''; setPrefix()
                    function setPrefix(){
                      if (authorGender.toLowerCase() === 'male'){ authorPrefix = 'Mr. '} 
                      else if (authorGender.toLowerCase() === 'female'){ authorPrefix = 'Ms. '};
                      };
                    var author = authorPrefix+countryData[clickedCountryIndex][authorLabel];
                    hrcDelegateArray.push(author);
                    } 
                  };
                }());
               // Declare varibale to hold the Delegates position for each attended session
              (function produceHRCdelegatePositions(){
                if (countryData[clickedCountryIndex]['hrcAllAttendedClass']!== ''){
                  for(i=0;i<numHRCattended;i+=1){
                    var positionLabel = allHRCAttended[i]+'delegatePosition'; 
                    var position = countryData[clickedCountryIndex][positionLabel];
                    hrcDelegatePositionArray.push(position);
                    } 
                  };
                }());

        /// FELLOWSHIP attendee beneficiary information
          var allFellowshipsAttended = [],          // Array of all fellowships participated in by class name (i.e. fellowship2015)
              fellowshipYearArray = [],             // Array of all fellowships participated in by year (i.e. 2015)
              firstFellowshipsAttended,             // First year participated in fellowship
              numFellowshipsAttended,               // Number of fellowships participated in      
              fellowshipAttendenceString,           // Sentence describing fellowships participated in  
              fellowshipQuotesArray = [],           // Delegate quotes corresponding to each attended fellowship
              fellowshipResearchArray = [],         // Delegate research topics 
              fellowshipDelegateArray = [];         // Delegate name (with prefix) corresponding to each attended fellowship
              fellowshipDelegatePositionArray = []; // Delegate position corresponding to delegate for each attended fellowship

          // Set of functions for data handling and treatment
            (function produceFellowshipsAttended(){
              if (countryData[clickedCountryIndex]['fellowshipAttendedClass'] !== ''){
                  allFellowshipsAttended = countryData[clickedCountryIndex]['fellowshipAttendedClass'].split(' ');    // turn the fellowshipXXXX class names into an array
                  };
              }());
            // Callll function to produce sentence listing sessions attended  
            (function produceFellowshipArray(){
              for(i=0;i<allFellowshipsAttended.length;i+=1){
                  var fellowshipYear = allFellowshipsAttended[i].slice(-4);                             
                  fellowshipYearArray.push(fellowshipYear);
                };
              firstFellowshipsAttended = fellowshipYearArray[0];              //  Finds the fellowship first attended
              numFellowshipsAttended = fellowshipYearArray.length;            //  Finds the number of fellowships attended
              }());

            (function produceFellowshipString(){
                var el1 = 'Participant in the ', // "Attended the "
                    el2 = '', // stores first/single session attendence
                    el3 = '', // stores all middle session attendence, preceded by a comma
                    el4 = '', // stores last session attendence, preceded by an 'and'
                    el5 = ''; // session(s) of the HRC

                if(fellowshipYearArray.length===0){}
                else if(fellowshipYearArray.length===1){ 
                  el2 = fellowshipYearArray[0]; el5 = ' Fellowship';
                  fellowshipAttendenceString = el1+el2+el5;} 
                else if (fellowshipYearArray.length===2){
                  el2 = fellowshipYearArray[0];   el4 = ' and '+fellowshipYearArray[1];  el5 = ' Fellowships'
                  fellowshipAttendenceString = el1+el2+el4+el5;}
                else {  for(i=1;i<fellowshipYearArray.length-1;i+=1){  el3 = ', '+fellowshipYearArray[i]};
                  el2 = fellowshipYearArray[0];   el4 = ' and '+fellowshipYearArray[fellowshipYearArray.length-1];  el5 = ' Fellowships'
                  fellowshipAttendenceString = el1+el2+el3+el4+el5;}
                }()); 
            // Call function to put all attendee quotes into an array
            (function produceFellowshipQuotes(){
                if (countryData[clickedCountryIndex]['fellowshipAttendedClass']!== ''){
                  for(i=0;i<numFellowshipsAttended;i+=1){
                    var quoteLabel = allFellowshipsAttended[i]+'delegateQuote'; 
                    var quote = countryData[clickedCountryIndex][quoteLabel];
                    fellowshipQuotesArray.push(quote);
                    } 
                  };
                }());
            // Call function to put all attendee research topics into an array
            (function produceFellowshipResearch(){
                if (countryData[clickedCountryIndex]['fellowshipAttendedClass']!== ''){
                  for(i=0;i<numFellowshipsAttended;i+=1){
                    var researchLabel = allFellowshipsAttended[i]+'delegateResearch'; 
                    var research = countryData[clickedCountryIndex][researchLabel];
                    fellowshipResearchArray.push(research);
                    } 
                  };
                }());
            // Call funcion to produce array delegate name for each attended fellowship (with gender prefix if applicable)
            (function produceFellowshipDelegates(){
                if (countryData[clickedCountryIndex]['fellowshipAttendedClass']!== ''){
                  for(i=0;i<numFellowshipsAttended;i+=1){
                    var authorLabel = allFellowshipsAttended[i]+'delegateName';  
                    var authorGender = countryData[clickedCountryIndex][allFellowshipsAttended[i]+'delegateGender']; 
                    var authorPrefix = ''; setPrefix()
                    function setPrefix(){
                      if (authorGender.toLowerCase() === 'male'){ authorPrefix = 'Mr. '} 
                      else if (authorGender.toLowerCase() === 'female'){ authorPrefix = 'Ms. '};
                      };
                    var author = authorPrefix+countryData[clickedCountryIndex][authorLabel];
                    fellowshipDelegateArray.push(author);
                    } 
                  };
                }());
             // Call function to produce array of delegate positions  
              (function produceFellowshipDelegatePositions(){
                if (countryData[clickedCountryIndex]['fellowshipAttendedClass']!== ''){
                  for(i=0;i<numFellowshipsAttended;i+=1){
                    var positionLabel = allFellowshipsAttended[i]+'delegatePosition'; 
                    var position = countryData[clickedCountryIndex][positionLabel];
                    fellowshipDelegatePositionArray.push(position);
                    } 
                  };
                }());

    // Build HTML 
      var delegateFeatured = countryData[clickedCountryIndex]['featuredDelegate']

      // Create a background flag
      d3.select('.backgroundFlag')
        .attr('src', function() {
          var iso2 = countryData[clickedCountryIndex]['iso2'].toLowerCase();
          return 'img/flags/'+iso2+'.svg'; })
        .style('opacity', 0)
        .transition()
          .duration(2000)
          .style('opacity', 0.3)

      // Create delegate photo
      d3.select('.backgroundPhoto')
          .attr('src', function() {
              var imageLink = countryData[clickedCountryIndex][delegateFeatured+'delegateImage'];
              if(imageLink===undefined){} else{
              return 'img/delegates/'+imageLink; };
           })

      // Attach standard content
      infoContent.append("h1").attr('class', 'countryHeader')
          .html(this.__data__.name);
      if(hrcMember!==''){
        infoContent.append("p").attr('class', 'hrcMember').html(hrcMember);
        infoContent.insert('img').attr('class', 'hrcIcon').attr('src','img/icons/unlogo.svg')
        } else {};
      infoContent.append("p").attr('class', 'countrySubHeader')
          .html(countryType+": Beneficiary of the Trust Fund");

      //Fund and mission section
      infoContent.append("div").attr('class', 'fundMission')
      infoContent.append("p").attr('class', 'fundYears').html('<strong>Years of receiving fund:</strong> '+countryData[clickedCountryIndex]['fundReceiveYears']);  
      if(countryData[clickedCountryIndex]['missionLocation']!==''){
        infoContent.append("div").attr('class', 'missionLocation').html('<strong>Location of permanent mission</strong>: '+countryData[clickedCountryIndex]['missionLocation']+'  '); 
        d3.select('.missionLocation').insert('img').attr('class', 'missionIcon').attr('src', function(){
          if(countryData[clickedCountryIndex]['missionLocation'] === 'New York'){return 'img/icons/statueOfLiberty.svg'}
          else if (countryData[clickedCountryIndex]['missionLocation'] === 'Capital'){return 'img/icons/pin.svg'}
        });
      } else {};
      infoContent.append("p").attr('class', 'infopageSpacer')

      // HRC section
      if(countryData[clickedCountryIndex]['benefitClass'].includes('hrcSession') === true){
        infoContent.append("p").attr('class', 'attendanceHeader').html('Attendance at Human Rights Council Sessions')
      if(firstHRCfunded!==''){
        infoContent.append("p").attr('class','hrcFirstAttended').html(firstHRCfunded)
      } else {}

        var hrcTable = infoContent.append("table").attr('width','100%').attr('class', 'hrcTable')
        var hrcTableHeaders = hrcTable.insert("tr").attr('class','tableHeaders')
        hrcTableHeaders.insert('th').attr('width','20%').html('Session')
        hrcTableHeaders.insert('th').attr('width','20%').html('Date')
        hrcTableHeaders.insert('th').attr('width','60%').html('Delegate')

        for (i=0;i<numHRCattended;i+=1){
          var newRow = hrcTable.insert('tr').attr('class','tableRow row'+i);
          newRow.insert('td').html(hrcSessionArray[i]+' Session');
          newRow.insert('td').html(hrcSessionDatesArray[i]);
          newRow.insert('td').html('<strong>'+hrcDelegateArray[i]+'</strong><br><span class="delegatePosition">'+hrcDelegatePositionArray[i]+'</span>');
        };
      }

      // Fellowship section
      if(countryData[clickedCountryIndex]['benefitClass'].includes('fellowship') === true){
        infoContent.append("p").attr('class', 'infopageSpacerGap')         
        infoContent.append("p").attr('class', 'attendanceHeader').html('HRC Fellowships')

        var fellowTable = infoContent.append("table").attr('width','100%').attr('class', 'fellowshipTable')
        var fellowTableHeaders = fellowTable.insert("tr").attr('class','tableHeaders')
        fellowTableHeaders.insert('th').attr('width','20%').html('Fellowship Year')
        fellowTableHeaders.insert('th').attr('width','20%').html('Delegate')
        fellowTableHeaders.insert('th').attr('width','60%').html('Research')

        for (i=0;i<numFellowshipsAttended;i+=1){
          var newRow = fellowTable.insert('tr').attr('class','tableRow row'+i);
          newRow.insert('td').html(fellowshipYearArray[i]+' Fellowship');
          newRow.insert('td').html('<strong>'+fellowshipDelegateArray[i]+'</strong><br>'+fellowshipDelegatePositionArray[i]);
          newRow.insert('td').html(fellowshipResearchArray[i]);        
        };
        infoContent.append("p").attr('class', 'infopageSpacerThin')
      }

      // Featured Delegate section
      if(countryData[clickedCountryIndex]['featuredDelegate']!== ''){ 
        var delegateIndex;
        if(delegateFeatured.includes('fellowship') ===true){
          delegateIndex= allFellowshipsAttended.indexOf(countryData[clickedCountryIndex]['featuredDelegate']);       
          infoContent.append("p").attr('class', 'meetDelegate').html('Meet '+nthWord(fellowshipDelegateArray[delegateIndex],2)+'!');
          infoContent.append("p").attr('class','quote').html('"'+fellowshipQuotesArray[delegateIndex]+'"');
        } else if(delegateFeatured.includes('hrc') ===true){
          delegateIndex= allHRCAttended.indexOf(countryData[clickedCountryIndex]['featuredDelegate']); 
          infoContent.append("p").attr('class', 'meetDelegate').html('Meet '+nthWord(hrcDelegateArray[delegateIndex],2)+'!');
          infoContent.append("p").attr('class','quote').html('"'+hrcQuotesArray[delegateIndex]+'"');
          };       
        };      

    }; 
      
  // Setup donor infopage
   function donorClick(){ 
    clearInfo();
    unLogo.attr('opacity',0)    
    var el = this; countryZoom(el);
    d3.select(this).classed('selectedCountry',true)
    clickedCountry = this.__data__.name;
    clickedCountryIndex  = countryData.map(function(obj, index) {
          if(obj.name == clickedCountry) {return index;}
          }).filter(isFinite)

    d3.select('#perspective').append("img").attr('class', 'backgroundFlag')
      .attr('src', function(d,i) {
        var iso2 = countryData[clickedCountryIndex]['iso2'].toLowerCase();
        return 'img/flags/'+iso2+'.svg'; })
      .style('opacity', 0)
      .transition()
        .duration(250)
        .style('opacity', 1)
      .transition()
        .duration(1750)
        .style('opacity', 0.3)
    infoContent.append("h1").attr('class', 'countryHeader')
        .html(this.__data__.name);
    infoContent.append("h3").attr('class', 'countrySubHeader')
        .html("Donor to the Trust Fund");
    infoContent.append("blockquote").attr('class','donorQuoteAuthoruote')
        .html(function(){ 
            if(countryData[clickedCountryIndex]['donorQuote']===''){} 
            else {return '"'+countryData[clickedCountryIndex]['donorQuote']+'"  '};});            
    infoContent.append("blockquote").attr('class','author')
        .html(function(){ 
              if(countryData[clickedCountryIndex]['donorAuthorPosition']===""){
                return '<strong>'+countryData[clickedCountryIndex]['donorQuoteAuthor']+'</strong>'}
                else {return '<strong>'+countryData[clickedCountryIndex]['donorQuoteAuthor']+'</strong>, '+countryData[clickedCountryIndex]['donorAuthorPosition']}
      });
    };

  // Zoom to country
    var active = d3.select(null);

    function countryZoom(el){
        if (active.node() === el) return zoomReset();
        active.classed("active", false);
        active = d3.select(el).classed("active", true);

        var bounds = el.getBBox(),
            x = bounds.x + bounds.width / 2,  
            y = bounds.y + bounds.height/2,
            dx =  bounds.width / 2,
            dy =  bounds.height,
            scale = Math.max(1, Math.min(5, 0.9 / Math.max(dx / width, dy / height))),
            translate = [ (width / 2 - scale * x) * 0.95  , height / 2 - scale * y];

        svg.transition()
            .duration(1000)
            .call( zoom.transform, d3.zoomIdentity.translate(translate[0],translate[1]).scale(scale) ); 
      };

      function zoomReset() {
        active.classed("active", false);
        active = d3.select(null);
        svg.transition()
            .duration(1250)
            .call( zoom.transform, d3.zoomIdentity ); 
      };

      function zoomed() {
        g.style("stroke-width", 1.5 / d3.event.transform.k + "px");
        g.attr("transform", d3.event.transform); 
      };

      // Zoom to country
      function zoomToArea(x,y,scale){
          svg.transition()
            .duration(1000)
            .call( zoom.transform, d3.zoomIdentity.translate(x,y).scale(scale) ); 
      };


///////////////////
// Code for tour //
///////////////////

  // Create lists of countries to tour 

    var ldcList =[], sidsList =[], beneficiaryList=[], donorList=[], caribbeanList=[];  //Lists with country IDs (i.e. no spaces and periods)
    var ldcListNames =[], sidsListNames =[], beneficiaryListNames=[], donorListNames=[], caribbeanListNames=[]; // Lists of full country names for display

    function produceLDClist(){
        for(i=0;i<countryData.length;i+=1){
          if(countryData[i].ldcClass==='ldc' && countryData[i].beneficiary==='beneficiary' ){
              var countryIDtoAdd = countryData[i].name.replace(/\s|\.+/g, '');
              var countryNametoAdd = countryData[i].name;                                       
              ldcList.push(countryIDtoAdd);  ldcListNames.push(countryNametoAdd);
            }
          };
        ldcList.sort();  ldcListNames.sort();
      };

    function produceSIDSlist(){
        for(i=0;i<countryData.length;i+=1){
          if(countryData[i].sidsClass==='sids' && countryData[i].beneficiary==='beneficiary' ){
              var countryIDtoAdd = countryData[i].name.replace(/\s|\.+/g, '');
              var countryNametoAdd = countryData[i].name;         
              sidsList.push(countryIDtoAdd); sidsListNames.push(countryNametoAdd); 
            }
          };
        sidsList.sort(); sidsListNames.sort();
      };

    function produceDonorlist(){
        for(i=0;i<countryData.length;i+=1){
          if(countryData[i].donorClass==='donor'){
              var countryIDtoAdd = countryData[i].name.replace(/\s|\.+/g, '');
              var countryNametoAdd = countryData[i].name;                                   
              donorList.push(countryIDtoAdd); donorListNames.push(countryNametoAdd);
            }
          };
        donorList.sort(); donorListNames.sort();
      };

    function produceCaribbeanList(){
        for(i=0;i<countryData.length;i+=1){
          if((countryData[i].sidsClass==='sids' || countryData[i].ldcClass==='ldc') && (countryData[i].subRegion==='Caribbean'||countryData[i].subRegion==='Central America') && countryData[i].beneficiary==='beneficiary' ){
              var countryIDtoAdd = countryData[i].name.replace(/\s|\.+/g, '');
              var countryNametoAdd = countryData[i].name;                            
              caribbeanList.push(countryIDtoAdd); caribbeanListNames.push(countryNametoAdd);
            }
          };
        caribbeanList.sort(); caribbeanListNames.sort();
      };

    function createTourLists(){
      produceLDClist();produceSIDSlist();produceDonorlist();produceCaribbeanList();
      beneficiaryList = ldcList.concat(sidsList); beneficiaryList = beneficiaryList.unique().sort();
      beneficiaryListNames = ldcListNames.concat(sidsListNames); beneficiaryListNames = beneficiaryListNames.unique().sort();
    };


  // Function to zoom to countries in Tour List
    function countryTourZoom(country, time){
      d3.selectAll('.selectedCountry').classed('selectedCountry beating',false);      // Highlights the selected country
      var country = d3.select('#'+country).classed('selectedCountry beating',true)

      var bounds = country.node().getBBox(),
          x = bounds.x + bounds.width / 2,  
          y = bounds.y + bounds.height/2,
          dx =  bounds.width / 2,
          dy =  bounds.height,
          scale = Math.max(1, Math.min(10, 0.9 / Math.max(dx / width, dy / height))),
          translate = [ (width / 2 - scale * x) , height / 2 - scale * y];

      svg.transition()
          .duration(time)
          .call( zoom.transform, d3.zoomIdentity.translate(translate[0],translate[1]).scale(scale) ); 
      };
    
    var tourIntroCounter = 0;
    var countryCounter = 0;             
    var _stop;                      // Boolean variable used to escape tour on clicking anywhere on the map
    var timer = 0;
    var tourDelay = 3000;

  // Tour function
    function tour(list, listnames) {         
      _stop = false; stopCounter =0;
      var country = list[countryCounter];
      var countryName = listnames[countryCounter];
      var countryStatus;
      var countryDataIndex  = countryData.map(function(obj, index) {               
            if(obj.name == countryName) {return index;}
            }).filter(isFinite)
      //Set conutryStatus
          if (countryData[countryDataIndex]['ldcClass'] === 'ldc' && countryData[countryDataIndex]['sidsClass'] === 'sids' && countryData[countryDataIndex]['beneficiary'] === 'beneficiary'){
                countryStatus = "Least Developed Country and Small Island Developing State"
              } else if (countryData[countryDataIndex]['ldcClass'] === 'ldc' && countryData[countryDataIndex]['beneficiary'] === 'beneficiary'){
                countryStatus = "Least Developed Country"                      
              } else if (countryData[countryDataIndex]['sidsClass'] === 'sids' && countryData[countryDataIndex]['beneficiary'] === 'beneficiary'){
                countryStatus = "Small Island Developing State"
              } else if (countryData[countryDataIndex]['donorClass'] === 'donor'){
                countryStatus = "Donor to the Trust Fund"
              };

      svg.on(clickevent,stopTour)

      svg.append('text')                                    // Add text element to display country name
        .attr('class','tourCountry')
        .attr('x',width/2)
        .attr('y',height*0.45)
      svg.append('text')                                    // Add text element to display country status
        .attr('class','tourCountryStatus')
        .attr('x',width/2)
        .attr('y',height*0.52)

      if(tourIntroCounter===0){
        d3.selectAll('.tourCountry')                       // Introduction
          .attr('fill','')
          .text("Let's take a tour!")
          .transition().delay(tourDelay/2)
            .text('');
        d3.selectAll('.tourCountryStatus')                       // Introduction
          .attr('fill','')
          .text('')
          .transition().delay(tourDelay/2)
            .text('');
            tourIntroCounter = 1
        }

      timer = setTimeout(function () {    
          countryTourZoom(country, tourDelay);               // Call  
          d3.selectAll('.tourCountry')                       // Add country name to screen
            .transition().delay(tourDelay/3)                
              .text(countryName)
          d3.selectAll('.tourCountryStatus')                       // Add country name to screen
            .transition().delay(tourDelay/3)                
              .text(countryStatus)
            if (countryCounter < list.length &&_stop===false) {            
              tour(list, listnames);      
              countryCounter++;       
            } else if (countryCounter === list.length &&_stop===false) {
              d3.selectAll('.tourCountry').transition().delay(tourDelay).remove();
              d3.selectAll('.tourCountryStatus').transition().delay(tourDelay).remove();
              countryCounter = 0;
              tourIntroCounter = 0;
              setTimeout(zoomReset, tourDelay)
            } 
          }, tourDelay)    
        };

      function stopTour(){                         // Add click event to stop tour, remove country annotation adn reset zoom
          _stop=true          
            clearTimeout(timer)
            d3.selectAll('.tourCountry').text('');
            d3.selectAll('.tourCountryStatus').text('');
            d3.selectAll('.selectedCountry').classed('selectedCountry beating', false);
            zoomReset()
            countryCounter = 0;
            tourIntroCounter = 0;  
        };


//////////////////////////
// Code for menu system //
//////////////////////////

var infoMenuCounter = 0;

// Background underlay rectangle: used for full page modals for gender, travel and education
svg.append('rect')
      .classed('underlay hidden', true)       // hide on load
      .attr('x' , 0)
      .attr('y' , 0)
      .attr('width', width)
      .attr('height', height)


// Hide menu and key onload
d3.selectAll('.menuButtonGroup').attr('transform','translate(0,'+ -height +')')
d3.select('#keyGroup').attr('transform','translate('+ -width/4 +',0)');

// Attach event handlers to menu icons
d3.select('#infoButtonIcon').on(clickevent, infoMenuEvent)
d3.select('#keyIcon').on('mouseover', keyMouseover).on('mouseout', keyMouseout)

d3.select('#menuUNlogo').on(clickevent,setupInfoIntro);
d3.select('#menuEggButton').on(clickevent,viewOptions);

d3.select('#menuGenderButton').on('mouseover',genderMouseover).on('mouseout',genderMouseout)
d3.select('#menuTravelButton').on('mouseover',travelMouseover).on('mouseout',travelMouseout)
d3.select('#menuEducationButton').on('mouseover',educationMouseover).on('mouseout',educationMouseout)

// Event listerners for info menu
  function infoMenuEvent(){
      if(infoMenuCounter===0){
          d3.selectAll('.menuButtonGroup')
            .transition()
              .duration(1200)
              .attr('transform','translate(0,0)');
        infoMenuCounter = 1;
      } else {
          d3.selectAll('.menuButtonGroup')
            .transition()
              .duration(1200)
              .attr('transform','translate(0,'+ -height +')');
        infoMenuCounter = 0;          
      };
    };

// Event listerners for key; key appears on mouseover and will automatically close the info menu if it is open
  function keyMouseover(){
      d3.select('#keyGroup').transition().attr('transform','translate(-10,0)')
      viewBox = document.getElementById("mapMenu");
      viewBox.setAttribute("viewBox", '0 0 220 531.496');
      clearTimeout(timer);
      d3.selectAll('.menuButtonGroup')
        .transition()
          .duration(250)
          .attr('transform','translate(0,'+ -height +')');
      infoMenuEvent = 0; 
  }

  function keyMouseout(){
      d3.select('#keyGroup').transition().duration(1000).attr('transform','translate('+ -width/4 +',0)');
      timer = setTimeout(
        function(){
          viewBox = document.getElementById("mapMenu");
          viewBox.setAttribute("viewBox", '0 0 100 531.496');}, 500)
  }


// Info pages: Gemder
  // Variables and functions to calculate gender breakdown metrics
    var femaleParticipantPct, maleParticipantPct, noDelegates;
    function genderBreakdown(){
        var delegateGenderAll = [];                                                             // Array of all delegate genders
        var allAttended = [];                                                                   // Array of all HRC and fellowships attendede
        var allHRCAttended = [];                              
        var allFellowshipAttended = [];    
        var femaleDelegateCount = 0;
        var maleDelegateCount = 0;

        for(i = 0; i < countryData.length; i+=1){                                                // Loop through all countries attendeded sessions and pull out gender of delegates
          if(countryData[i]['hrcAllAttendedClass']!==''){
            allHRCAttended = countryData[i]['hrcAllAttendedClass'].split(' ')};                 // Array of all HRC's attended for looking up

          if(countryData[i]['fellowshipAttendedClass']!==''){
            allFellowshipAttended = countryData[i]['fellowshipAttendedClass'].split(' ')};      // Array of all Fellowship's attended for looking up

          allAttended = allHRCAttended.concat(allFellowshipAttended);                           // Merge all attendances to one array

          for (j = 0; j < allAttended.length; j++){
            if(countryData[i][allAttended[j]+'delegateGender']!==''){                           // Use attendance array to search arrays for gender stamps
                delegateGenderAll.push(countryData[i][allAttended[j]+'delegateGender'])         // Push non-empty gender fields to array
            };
          };
        };

        for(var i=0;i<delegateGenderAll.length;i+=1){                                            // Count female delegates
            if(delegateGenderAll[i] === "Female")
               femaleDelegateCount++;
           };

        for(var i=0;i<delegateGenderAll.length;i+=1){                                            // Count male delegates
            if(delegateGenderAll[i] === "Male")
               maleDelegateCount++;
           };

        femaleParticipantPct = Math.round(femaleDelegateCount / delegateGenderAll.length * 1000) / 10 + '%';
        maleParticipantPct = Math.round(maleDelegateCount / delegateGenderAll.length * 1000) / 10 + '%';
        noDelegates = delegateGenderAll.length
      };

  // Attach gender symbols (loaded from external SVG files)
    function attachGenderSummary(){
        maleLogo = svg.append('svg').attr('id','maleIcon')
            .attr('x', width*0.2)
            .attr('y', height*0.15)
            .attr('viewBox','0 0 100 100')            
            .attr('width', width*0.25)
            .attr('height', width*0.25)

        d3.html("img/icons/maleIcon.svg", loadMaleIconSVG);
          function loadMaleIconSVG  (svgData) {
              d3.select('#maleIcon').each(function() {
              var gParent = this;
              d3.select(svgData).selectAll("path").each(function() {
                    gParent.appendChild(this.cloneNode(true))
                });
          }); };

        femaleLogo = svg.append('svg').attr('id','femaleIcon')
            .attr('x', width*0.2)
            .attr('y', height*0.15)
            .attr('viewBox','0 78 100 100')
            .attr('width', width*0.25)
            .attr('height', width*0.25)

        d3.html("img/icons/femaleIcon.svg", loadFemaleIconSVG);
          function loadFemaleIconSVG  (svgData) {
              d3.select('#femaleIcon').each(function() {
              var gParent = this;
              d3.select(svgData).selectAll("path").each(function() {
                    gParent.appendChild(this.cloneNode(true))
                });
          }); };

        }


    // Mousever interaction for gender button to displaye summary stats
    function genderMouseover(){
          d3.selectAll('.underlay').classed('hidden',false)
            .attr('opacity',0)
            .transition().duration(800)
              .attr('opacity',0.3)
          attachGenderSummary();      
          svg.append('text')                                    // Add text element to display gender headline
          .attr('class','genderText')
          .attr('x',width*0.5)
          .attr('y',height*0.525)
          .text('Delegates and Fellows')
          .attr('opacity',0)
            .transition()
            .duration(1500)
            .attr('opacity',0.6)

          svg.append('text')    
          .text(femaleParticipantPct)
          .attr('class','femalePct')                                     
          .attr('x',width*0.35)
          .attr('y',height*0.375)
          .attr('transform','translate(0,'+-height+')')
            .transition()
            .duration(1500)
            .attr('transform','translate(0,0)')

          svg.append('text')                                   
          .text(maleParticipantPct)
          .attr('class','malePct')
          .attr('x',width*0.6)
          .attr('y',height*0.675)
          .attr('transform','translate(0,'+height+')')   
            .transition()
            .duration(1500)
            .attr('transform','translate(0,0)')
      };

    function genderMouseout(){
          d3.selectAll('.underlay').transition().attr('opacity',0)
          d3.selectAll('.genderText')
            .transition()
            .attr('opacity',0)
            .transition()
              .remove()

          d3.selectAll('.femalePct')
            .transition().duration(1500)
              .attr('transform','translate(0,'+-height+')')

          d3.selectAll('.malePct')
            .transition().duration(1500)
              .attr('transform','translate(0,'+height+')')   
      };
    







var travelKms = "xxx,xxx,xxx"+" kms"
function travelMouseover(){
      svg.append('text')                                    // Add text element to display gender headline
      .attr('class','travelKms')
      .attr('x',width/2)
      .attr('y',height*0.5)
      .text(travelKms)
      .attr('opacity',0)
        .transition()
        .duration(1500)
        .attr('opacity',0.8)

      svg.append('text')                                    // Add text element to display gender headline
      .attr('class','travelText')
      .attr('x',width*0.5)
      .attr('y',height*0.65)
      .attr('transform','translate(0,'+height+')')   
      .text("traveled by Delegates and Fellows")
        .transition()
        .duration(1500)
        .attr('transform','translate(0,0)')
  };

function travelMouseout(){
      d3.selectAll('.travelKms')
        .transition()
        .attr('opacity',0)
        .transition()
          .remove()

      d3.selectAll('.travelText')
        .transition().duration(1500)
          .attr('transform','translate(0,'+height+')')   
  };

function educationMouseover(){
      svg.append('text')                                    // Add text element to display gender headline
      .attr('class','Learning and capacity building')
      .attr('x',width/2)
      .attr('y',height*0.5)
      .text(travelKms)
      .attr('opacity',0)
        .transition()
        .duration(1500)
        .attr('opacity',0.8)

      svg.append('text')                                    // Add text element to display gender headline
      .attr('class','travelText')
      .attr('x',width*0.6)
      .attr('y',height*0.625)
      .attr('transform','translate(0,'+height+')')   
      .text("(")
        .transition()
        .duration(1500)
        .attr('transform','translate(0,0)')
  };

function educationMouseout(){
      d3.selectAll('.travelKms')
        .transition()
        .attr('opacity',0)
        .transition()
          .remove()

      d3.selectAll('.travelText')
        .transition().duration(1500)
          .attr('transform','translate(0,'+height+')')   
  };


// function cheapSketchy(path) {
//   var length = path.getTotalLength();
//   var drawCode = "";
//   var i = 0;
//   var step = 2;

//   while (i < length / 2) {
//     var start = path.getPointAtLength(i);
//     var end = path.getPointAtLength(length - i);

//     drawCode += " M" + (start.x + (Math.random() * step - step/2)) + " " + (start.y + (Math.random() * step - step/2)) + "L" + (end.x + (Math.random() * step - step/2)) + " " + (end.y + (Math.random() * step - step/2));

//     i += step + (Math.random() * step);
//   }
//   return drawCode;
// }

// function cheapSketchyOutline(path) {
//   var j = 2;
//   var i = 0;
//   var length = path.getTotalLength();
//   var pointsArray = [];

//   while (i < length) {
//     newPoint = path.getPointAtLength(i);
//     pointsArray.push({x: newPoint.x + (j/2 - Math.random() * j), y: newPoint.y + (j/2 - Math.random() * j)});
//     i += j + (Math.random() * (j));
//   }
//   //Make sure to get the last point
//   pointsArray.push(path.getPointAtLength(length));

//   var line = d3.line()
//   .x(function(d) { return d.x; })
//   .y(function(d) { return d.y; })
//   .curve(d3.curveBasis);

//   return line(pointsArray);
// }

