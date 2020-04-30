


// Variables for sunburst
var width = 700;
var radius = width / 6;
var format = d3.format(",d")
var arc = d3.arc()
    .startAngle(d => d.x0)
    .endAngle(d => d.x1)
    .padAngle(d => Math.min((d.x1 - d.x0) / 2, 0.005))
    .padRadius(radius * 1.5)
    .innerRadius(d => d.y0 * radius)
    .outerRadius(d => Math.max(d.y0 * radius, d.y1 * radius - 1))



// Partition function
partition = data => {
  const root = data
  return d3.partition().size([2 * Math.PI, root.height + 1])(root);
}

// Create space for visuals
const svg1 = d3.select("#sunburst")
    .attr("viewBox", [0, 0, width * 1.5, width * 1.2])
    .style("font", "13px sans-serif");



// Data
d3.csv('/static/articles/spotify_d3/data/final_df.csv').then(function(vCsvData) {
  d3.csv('/static/articles/spotify_d3/data/total_listens.csv').then(function(total_listens_artist ) {
    d3.csv('/static/articles/spotify_d3/data/total_listens_track.csv').then(function(total_listens_song) {
        
      stratify_data = d3
          .stratify()
          .id(d => d.id)
          .parentId(d => d.parent)(vCsvData)
          .sum(d => d.value)
          .sort((a, b) => d3.ascending(a.id, b.id))

      draw(stratify_data, total_listens_artist, total_listens_song, svg1);
    });
  });
});


function draw(stratify_data, total_listens_artist, total_listens_song, svg) {
  const root = partition(stratify_data);

  var color = d3.scaleOrdinal(d3.quantize(d3.interpolateRainbow, stratify_data.children.length + 1));

  root.each(d => d.current = d);

  const g = svg.append("g")
    .attr("transform", `translate(${width / 2},${width / 2})`);

  const path = g.append("g")
    .selectAll("path")
    .data(root.descendants().slice(1))
    .enter()
    .append("path")
    .attr("fill", d => { while (d.depth > 1) d = d.parent; return color(d.data.id); })
    .attr("fill-opacity", d => arcVisible(d.current) ? (d.children ? 0.6 : 0.4) : 0)
    .attr("d", d => arc(d.current));
 
  path.filter(d => d.children)
      .style("cursor", "pointer")
      .on("click", clicked);

  path.append("title")
      .text(d => `${d.ancestors().map(d => d.data.id).reverse().join("/")}\n${format(d.value)}`);

  const label = g.append("g")
      .attr("pointer-events", "none")
      .attr("text-anchor", "middle")
      .style("user-select", "none")
    .selectAll("text")
    .data(root.descendants().slice(1))
    .enter()
    .append("text")
      .attr("dy", "0.35em")
      .attr("fill-opacity", d => +labelVisible(d.current))
      .attr("transform", d => labelTransform(d.current))
      .text(d => d.data.id);

  const parent = g.append("circle")
      .datum(root)
      .attr("r", radius)
      .attr("fill", "none")
      .attr("pointer-events", "all")
      .on("click", clicked);
  
  function clicked(p) {
    displayTopArtists(p)
    console.log(p);
    
    parent.datum(p.parent || root);

    root.each(d => d.target = {
      x0: Math.max(0, Math.min(1, (d.x0 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI,
      x1: Math.max(0, Math.min(1, (d.x1 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI,
      y0: Math.max(0, d.y0 - p.depth),
      y1: Math.max(0, d.y1 - p.depth)
    });

    const t = g.transition().duration(800);

    // Transition the data on all arcs, even the ones that aren’t visible,
    // so that if this transition is interrupted, entering arcs will start
    // the next transition from the desired position.
    path.transition(t)
        .tween("data", d => {
          const i = d3.interpolate(d.current, d.target);
          return t => d.current = i(t);
        })
      .filter(function(d) {
        return +this.getAttribute("fill-opacity") || arcVisible(d.target);
      })
        .attr("fill-opacity", d => arcVisible(d.target) ? (d.children ? 0.6 : 0.4) : 0)
        .attrTween("d", d => () => arc(d.current));

    label.filter(function(d) {
        return +this.getAttribute("fill-opacity") || labelVisible(d.target);
      }).transition(t)
        .attr("fill-opacity", d => +labelVisible(d.target))
        .attrTween("transform", d => () => labelTransform(d.current));
  }

  function arcVisible(d) {
    return d.y1 <= 3 && d.y0 >= 1 && d.x1 > d.x0;
  }

  function labelVisible(d) {
      return d.y1 <= 3 && d.y0 >= 1 && (d.y1 - d.y0) * (d.x1 - d.x0) > 0.06;
  }

  function labelTransform(d) {
      const x = (d.x0 + d.x1) / 2 * 180 / Math.PI;
      const y = (d.y0 + d.y1) / 2 * radius;
      return `rotate(${x - 90}) translate(${y},0) rotate(${x < 180 ? 0 : 180})`;
  }



  function displayTopArtists(p) {
    // var large_land = data.filter(function(d) { return d.land_area > 200; });
    d3.select("#table_l").selectAll("*").remove()
    d3.select("#table_r").selectAll("*").remove()

    if (p.id == "Genre"){
      return;
    } else {
      artist_data = total_listens_artist.filter(d => d.genres == p.id);
      song_data = total_listens_song.filter(d => d.genres == p.id);
    }
    artist_data = artist_data.slice(0, 5);
    song_data = song_data.slice(0, 5);
    console.log(song_data)

    produceTable("#table_l", artist_data, ["artistName", "total_listens"], ["Artist", "Listens"])
    produceTable("#table_r", song_data, ["artistName", "trackName", "total_listens_track"], 
                                            ["Artist", "Song", "Listens"])

  };

  function produceTable(id, data, columns, column_names) {
    var table = d3.select(id)
        , columnNames = column_names
        , thead = table.append("thead")
        , tbody = table.append("tbody");

    // append the header row
    thead.append("tr")
        .selectAll("th")
        .data(columnNames)
        .enter()
        .append("th")
        .text(function (columnNames) { return columnNames; });

    // create a row for each object in the data
    var rows = tbody.selectAll("tr")
        .data(data)
        .enter()
        .append("tr");

    // create a cell in each row for each column
    var cells = rows.selectAll("td")
        .data(function (row) {
            return columns.map(function (column) {
                return { column: column, value: row[column] };
            });
        })
        .enter()
        .append("td")
        .attr("style", "font-family: 'Lato'")
          .html(d => d.value);
  }

}







  