


// Variables for sunburst
var width = 700;
var radius = width / 4;
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

// Data
d3.csv('/static/articles/spotify_d3/data/genre_hierarchy.csv').then(function(vCsvData) {
  d3.csv('/static/articles/spotify_d3/data/total_listens_artist.csv').then(function(total_listens_artist ) {
    d3.csv('/static/articles/spotify_d3/data/total_listens_artist_all_genres.csv').then(function(total_listens_artist_all ) {
      d3.csv('/static/articles/spotify_d3/data/total_listens_track.csv').then(function(total_listens_song) {
        d3.csv('/static/articles/spotify_d3/data/total_listens_track_all_genres.csv').then(function(total_listens_song_all) {    
          d3.csv('/static/articles/spotify_d3/data/enriched_song_data.csv').then(function(enriched_song_data) {
            stratify_data = d3
                .stratify()
                .id(d => d.id)
                .parentId(d => d.parent)(vCsvData)
                .sum(d => d.value)
                .sort((a, b) => d3.ascending(a.id, b.id))

            draw(stratify_data, total_listens_artist, total_listens_song, enriched_song_data);
          });
        });
      });
    });
  });
});


function draw(stratify_data, total_listens_artist, total_listens_song, enriched_song_data) {

  const svg = d3.select("#sunburst")
      .attr("viewBox", [-140, -50, width * 1.5, width * 1.2])
      .style("font", "13px sans-serif");

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
    .attr("d", d => arc(d.current))
    .style("cursor", "pointer")
    .on("click", displayGenreData);
 
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
      .style("font-size", "20px")
      .text(d => d.data.id);

  const parent = g.append("circle")
      .datum(root)
      .attr("r", radius)
      .attr("fill", "none")
      .attr("pointer-events", "all")
      .on("click", clicked);
  
  function clicked(p) {

    displayGenreData(p)
    
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
    return d.y1 <= 2 && d.y0 >= 1 && d.x1 > d.x0;
  }

  function labelVisible(d) {
      return d.y1 <= 2 && d.y0 >= 1 && (d.y1 - d.y0) * (d.x1 - d.x0) > 0.06;
  }

  function labelTransform(d) {
      const x = (d.x0 + d.x1) / 2 * 180 / Math.PI;
      const y = (d.y0 + d.y1) / 2 * radius;
      return `rotate(${x - 90}) translate(${y},0) rotate(${x < 180 ? 0 : 180})`;
  }


  function displayGenreData(p) {

    // var large_land = data.filter(function(d) { return d.land_area > 200; });
    d3.select("#table_l").selectAll("*").remove()
    d3.select("#table_r").selectAll("*").remove()
    d3.select("#bar_race").selectAll("*").remove()
    d3.select("#seq_sunburst").selectAll("*").remove()
    d3.select("#seq_description").selectAll("*").remove()

    console.log(p)
    if (p.id.trim() == "Genre" || p.height > 0){
      return;
    } else {
      artist_data = total_listens_artist.filter(d => d.genres == p.id.trim()).slice(0, 5);
      song_data = total_listens_song.filter(d => d.genres == p.id.trim()).slice(0, 5);
      total_listens_genre = enriched_song_data.filter(d => d.genres == p.id.trim());
    }

    d3.csv('/static/articles/spotify_d3/data/bar_race_data/' + p.id.trim() + '.csv', d3.autoType).then(function(data) {
      d3.json('/static/articles/spotify_d3/data/time_hierarchy_data/' + p.id.replace(/\s+/g, '') + '.json', d3.autoType).then(function(time_data) {
        produceSeqSunburst(time_data, total_listens_genre, p.id.trim());
        produceBarRace(data);
        produceTable("#table_l", artist_data, ["artistName", "total_listens"], ["Artist", "Listens"])
        produceTable("#table_r", song_data, ["artistName", "trackName", "total_listens_track"], 
                                                ["Artist", "Song", "Listens"])
        smoothScroll("table_l")
      })
    });

  };

  function produceSeqSunburst(data, total_listens, genre){

    partition = data => {
      return d3.partition().size([2 * Math.PI, radius * radius])(
        d3
          .hierarchy(data)
          .sum(d => d.value)
          .sort((a, b) => d3.ascending(a.name, b.name))
        
      )
    }

    let color = d3.scaleOrdinal()
                  .domain(["2016", "2017", "2018", "2019", "2020", 
                           "summer", "spring", "fall", "winter", 
                           "weekday", "weekend"])
                  .range(["#D39AFC", "#AB8BF9", "#8B9DF9", "#8BBFF9", "#8BF2F9", 
                          "#F98B8B", "#AFFC9A", "#FCF89A", "#F9C38B",
                          "#D8D4D4", "#ACACAC"])

    var width = 1000;
    var radius = width / 2;
    var arc = d3.arc()
      .startAngle(d => d.x0)
      .endAngle(d => d.x1)
      .padAngle(1 / radius)
      .padRadius(radius)
      .innerRadius(d => Math.sqrt(d.y0))
      .outerRadius(d => Math.sqrt(d.y1) - 1)

    var mousearc = d3.arc()
      .startAngle(d => d.x0)
      .endAngle(d => d.x1)
      .innerRadius(d => Math.sqrt(d.y0))
      .outerRadius(radius)


    var breadcrumbWidth = 100;
    var breadcrumbHeight = 40;


    function breadcrumbPoints(d, i) {
      const tipWidth = 10;
      const points = [];
      points.push("0,0");
      points.push(`${breadcrumbWidth},0`);
      points.push(`${breadcrumbWidth + tipWidth},${breadcrumbHeight / 2}`);
      points.push(`${breadcrumbWidth},${breadcrumbHeight}`);
      points.push(`0,${breadcrumbHeight}`);
      if (i > 0) {
        // Leftmost breadcrumb; don't include 6th vertex.
        points.push(`${tipWidth},${breadcrumbHeight / 2}`);
      }
      return points.join(" ");
    }

    function updateBreadcrumb(sequence, percentage){
      d3.select("#breadcrumb")
        .style("visibility", "");
      const svg = d3
        .select("#breadcrumb")

      const g = svg
        .selectAll("g")
        .data(sequence)
        .join("g")
        .attr("transform", (d, i) => `translate(${i * breadcrumbWidth}, 0)`);

      g.append("polygon")
        .attr("points", breadcrumbPoints)
        .attr("fill", d => color(d.data.name))
        .attr("stroke", "black");

      g.append("text")
        .attr("x", (breadcrumbWidth + 10) / 2)
        .attr("y", breadcrumbHeight / 2)
        .attr("dy", "0.35em")
        .attr("text-anchor", "middle")
        .attr("fill", "black")
        .text(d => d.data.name);

      svg
        .append("text")
        .text(percentage > 0 ? percentage + "%" : "")
        .attr("x", (sequence.length + 0.5) * breadcrumbWidth)
        .attr("y", breadcrumbHeight / 2)
        .attr("dy", "0.35em")
        .attr("text-anchor", "middle");

      return svg.node();
    }

    function initBreadcrumb(){
      d3.select("#breadcrumb")
        .attr("viewBox", `-95 0 ${breadcrumbWidth * 5} ${breadcrumbHeight * 1.2}`)
        .style("max-width", `700px`)
        .style("font", "20px sans-serif")
        .style("margin", "20px");
    }


    let sunburst = function(genre) {
      
      initBreadcrumb()
      const root = partition(data);
      const svg = d3.select("#seq_sunburst")
            .attr("viewBox", [0, 0, width*1.2, width*1.2]);  

      // Make this into a view, so that the currently hovered sequence is available to the breadcrumb
      const element = svg.node();
      element.value = { sequence: [], percentage: 0.0 };

      const label = svg
        .append("text")
        .attr("text-anchor", "middle")
        .attr("fill", "#888")
        .style("visibility", "hidden");

      label
        .append("tspan")
        .attr("class", "percentage")
        .attr("x", 0)
        .attr("y", 0)
        .attr("dy", "-0.1em")
        .attr("font-size", "12em")
        .text("");

      label
        .append("tspan")
        .attr("x", 0)
        .attr("y", 0)
        .attr("dy", "1em")
        .attr("font-size", "2em")
        .text("of visits begin with this sequence");

      svg
        .attr("viewBox", `${-600} ${-radius} ${width*1.2} ${width*1.2}`)
        .style("max-width", `${width}px`)
        .style("font", "12px sans-serif");

      const path = svg
        .append("g")
        .selectAll("path")
        .data(
          root.descendants().filter(d => {
            // Don't draw the root node, and for efficiency, filter out nodes that would be too small to see
            return d.depth && d.x1 - d.x0 > 0.001;
          })
        )
        .join("path")
        .attr("fill", d => color(d.data.name))
        .attr("d", arc);

      svg
        .append("g")
        .attr("fill", "none")
        .attr("pointer-events", "all")
        .on("mouseleave", () => {
          path.attr("fill-opacity", 1);
          label.style("visibility", "hidden");
          // Update the value of this view
          element.value = { sequence: [], percentage: 0.0 };
          element.dispatchEvent(new CustomEvent("input"));
          d3.select("#breadcrumb")
            .style("visibility", "hidden");
          d3.select("#breadcrumb").selectAll("*").remove()
        })
        .selectAll("path")
        .data(
          root.descendants().filter(d => {
            // Don't draw the root node, and for efficiency, filter out nodes that would be too small to see
            return d.depth && d.x1 - d.x0 > 0.001;
          })
        )
        .join("path")
        .attr("d", mousearc)
        .on("mouseenter", d => {
          // Get the ancestors of the current segment, minus the root
          const sequence = d
            .ancestors()
            .reverse()
            .slice(1);
          // Highlight the ancestors
          path
            .attr("fill-opacity", node =>
              sequence.indexOf(node) >= 0 ? 1.0 : 0.3
            );
          const percentage = ((100 * d.value) / root.value).toPrecision(3);
          label
            .style("visibility", null)
            .select(".percentage")
            .text(percentage + "%");
          // Update the value of this view with the currently hovered sequence and percentage
          element.value = { sequence, percentage };
          element.dispatchEvent(new CustomEvent("input"));
          d3.select("#breadcrumb").selectAll("*").remove()
          updateBreadcrumb(sequence, percentage);
        })
        .on("click", d => {
          const sequence = d
            .ancestors()
            .reverse()
            .slice(1);
          clicked_seq(sequence, genre);
        });

      return element;
    }

    function clicked_seq(seq, genre){
      d3.select("#seq_description").selectAll("*").remove()
      var num_vars = seq.length
      var year = seq[0].data.name
      filtered_total_listens = total_listens.filter(d => d.year == year);
      console.log(filtered_total_listens);

      if (num_vars > 1){
        var season = seq[1].data.name;
        filtered_total_listens = filtered_total_listens.filter(d => d.season == season);
      }
      if (num_vars > 2){
        var weekday = seq[2].data.name
        console.log(filtered_total_listens)
        console.log(weekday)
        filtered_total_listens = filtered_total_listens.filter(d => d.weekday == weekday);
        console.log(filtered_total_listens)
      }
      var total_songs = filtered_total_listens.length;
      var total_listen_artist = rollup(filtered_total_listens, v => d3.sum(v, d => d.count), d => d.artistName)
      var top_artist = greatest(total_listen_artist, ([, sum]) => sum)[0]
      var total_listen_song = rollup(filtered_total_listens, v => d3.sum(v, d => d.count), d => d.trackName)
      var top_song = greatest(total_listen_song, ([, sum]) => sum)[0]
      var top_song_artist = total_listens.filter(d => d.trackName == top_song)[0].artistName

      const description = d3.select("#seq_description")
          .append("text")
          .attr("text-anchor", "middle")
          .attr("fill", "#888")

      if (num_vars == 1){
        description
          .text(`In ${year}, across all seasons and all days of the week, you listened to ${total_songs} ${genre} 
                  songs. Out of all those songs, the artist you played most was ${top_artist}, and the song
                  you played most was ${top_song}, by ${top_song_artist}.`);
      } else if (num_vars == 2){
        description
          .text(`In the ${season} of ${year}, across all days of the week, you listened to ${total_songs} ${genre} 
                  songs. Out of all those songs, the artist you played most was ${top_artist}, and the song
                  you played most was ${top_song}, by ${top_song_artist}.`);
      } else if (num_vars == 3){
        description   
          .text(`On ${weekday}s in the ${season} of ${year}, you listened to ${total_songs} ${genre} 
                  songs. Out of all those songs, the artist you played most was ${top_artist}, and the song
                  you played most was ${top_song}, by ${top_song_artist}.`);
      }
    }

    sunburst(genre);
  }

  function produceBarRace(data) {

    var duration = 40;
    var n = 12;
    var k = 6;
    var names = new Set(data.map(d => d.artist))

    var datevalues = Array.from(rollup(data, ([d]) => d.sum, d => +d.date, d => d.artist))
      .map(([date, data]) => [new Date(date), data])
      .sort(([a], [b]) => d3.ascending(a, b))


    var keyframes = keyframes(datevalues);
    var nameframes = groups(keyframes.flatMap(([, data]) => data), d => d.name);
    var prev = new Map(nameframes.flatMap(([, data]) => d3.pairs(data, (a, b) => [b, a])));
    var next = new Map(nameframes.flatMap(([, data]) => d3.pairs(data)));
    var margin = ({top: 14, right: 6, bottom: 6, left: 0});
    var barSize = 52;
    var height = margin.top + barSize * n + margin.bottom + 100;
    
    let x = d3.scaleLinear([0, 1], [margin.left, width - margin.right])
    let y = d3.scaleBand()
      .domain(d3.range(n + 1))
      .rangeRound([margin.top, margin.top + barSize * (n + 1 + 0.1)])
      .padding(0.1)
    let color =  d3.scaleOrdinal(d3.schemeTableau10);    

    function keyframes(_datevalues){
      const keyframes = [];
      let ka, a, kb, b;
      for ([[ka, a], [kb, b]] of d3.pairs(_datevalues)) {
        for (let i = 0; i < k; ++i) {
          const t = i / k;
          keyframes.push([
            new Date(ka * (1 - t) + kb * t),
            rank(name => (a.get(name) || 0) * (1 - t) + (b.get(name) || 0) * t)
          ]);
        }
      }
      keyframes.push([new Date(kb), rank(name => b.get(name) || 0)]);
      return keyframes;
    }

    function rank(value) {
      const data = Array.from(names, name => ({name, value: value(name)}));
      data.sort((a, b) => d3.descending(a.value, b.value));
      for (let i = 0; i < data.length; ++i) data[i].rank = Math.min(n, i);
      return data;
    }

    function bars(svg) {
      let bar = svg.append("g")
          .attr("fill-opacity", 0.6)
        .selectAll("rect");

      return ([date, data], transition) => bar = bar
        .data(data.slice(0, n), d => d.name)
        .join(
          enter => enter.append("rect")
            .attr("fill", d => color(d.name))
            .attr("height", y.bandwidth())
            .attr("x", x(0))
            .attr("y", d => y((prev.get(d) || d).rank))
            .attr("width", d => x((prev.get(d) || d).value) - x(0)),
          update => update,
          exit => exit.transition(transition).remove()
            .attr("y", d => y((next.get(d) || d).rank))
            .attr("width", d => x((next.get(d) || d).value) - x(0))
        )
        .call(bar => bar.transition(transition)
          .attr("y", d => y(d.rank))
          .attr("width", d => x(d.value) - x(0)));
    }

    function labels(svg) {
        let label = svg.append("g")
            .style("font", "bold 12px var(--sans-serif)")
            .style("font-size", "20px")
            .style("font-variant-numeric", "tabular-nums")
            .attr("text-anchor", "end")
          .selectAll("text");

        return ([date, data], transition) => label = label
          .data(data.slice(0, n), d => d.name)
          .join(
            enter => enter.append("text")
              .attr("transform", d => `translate(${x((prev.get(d) || d).value)},${y((prev.get(d) || d).rank)})`)
              .attr("y", y.bandwidth() / 2)
              .attr("x", -6)
              .attr("dy", "-0.25em")
              .text(d => d.name)
              .call(text => text.append("tspan")
                .attr("fill-opacity", 0.7)
                .attr("font-weight", "normal")
                .attr("x", -6)
                .attr("dy", "1.15em")),
            update => update,
            exit => exit.transition(transition).remove()
              .attr("transform", d => `translate(${x((next.get(d) || d).value)},${y((next.get(d) || d).rank)})`)
              .call(g => g.select("tspan").tween("text", d => textTween(d.value, (next.get(d) || d).value)))
          )
          .call(bar => bar.transition(transition)
            .attr("transform", d => `translate(${x(d.value)},${y(d.rank)})`)
            .call(g => g.select("tspan").tween("text", d => textTween((prev.get(d) || d).value, d.value))))
    }

    function textTween(a, b) {
      const i = d3.interpolateNumber(a, b);
      return function(t) {
        this.textContent = d3.format(",d")(i(t));
      };
    }

    function axis(svg) {
      const g = svg.append("g")
          .attr("transform", `translate(0,${margin.top})`)
          .style("font-size", "22px");

      const axis = d3.axisTop(x)
          .ticks(width / 160)
          .tickSizeOuter(0)
          .tickSizeInner(-barSize * (n + y.padding()));

      return (_, transition) => {
        g.transition(transition).call(axis);
        g.select(".tick:first-of-type text").remove();
        g.selectAll(".tick:not(:first-of-type) line").attr("stroke", "white");
        g.select(".domain").remove();
      };
    }

    function ticker(svg) {
      const now = svg.append("text")
          .style("font", "bold")
          .style("font-size", "42px")
          .style("font-variant-numeric", "tabular-nums")
          .attr("text-anchor", "end")
          .attr("x", width - 6)
          .attr("y", margin.top + barSize * (n - 0.45))
          .attr("dy", "0.32em")
          .text(d3.utcFormat("%m-%Y")(keyframes[0][0]));

      return ([date], transition) => {
        transition.end().then(() => now.text(d3.utcFormat("%m-%Y")(date)));
      };
    }

    let chart = async function() {
      // replay;

      const svg = d3.select("#bar_race")
          .attr("viewBox", [0, -100, width, height]);

      let title = svg.append("text")
         .attr("class", "title")
         .attr("y", -65)
         .text("Top Artists over the Years")
         .style("font-size" , "24");

      let subTitle = svg.append("text")
         .attr("class", "subTitle")
         .attr("y", -20)
         .text("Total Songs Listened to by Artist")
         .style("font-size" , "18px");
      const updateBars = bars(svg);
      const updateAxis = axis(svg);
      const updateLabels = labels(svg);
      const updateTicker = ticker(svg);

      for (const keyframe of keyframes) {
        const transition = svg.transition()
            .duration(duration)
            .ease(d3.easeLinear);

        // Extract the top bar’s value.
        x.domain([0, keyframe[1][0].value]);

        updateAxis(keyframe, transition);
        updateBars(keyframe, transition);
        updateLabels(keyframe, transition);
        updateTicker(keyframe, transition);

        await transition.end();
      }
    }

    chart();

  }

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

  function smoothScroll(elementId) {
    var target = document.getElementById(elementId);
    var scrollContainer = target;
    do { //find scroll container
        scrollContainer = scrollContainer.parentNode;
        if (!scrollContainer) return;
        scrollContainer.scrollTop += 1;
    } while (scrollContainer.scrollTop == 0);

    var targetY = 0;
    do { //find the top of target relatively to the container
        if (target == scrollContainer) break;
        targetY += target.offsetTop;
    } while (target = target.offsetParent);

    scroll = function(c, a, b, i) {
        i++; if (i > 30) return;
        c.scrollTop = a + (b - a) / 30 * i;
        setTimeout(function(){ scroll(c, a, b, i); }, 20);
    }
    // start scrolling
    scroll(scrollContainer, scrollContainer.scrollTop, targetY, 0);
  }

}

function identity(x){
  return x;
}

function nest(values, map, reduce, keys) {
  return (function regroup(values, i) {
    if (i >= keys.length) return reduce(values);
    const groups = new Map();
    const keyof = keys[i++];
    let index = -1;
    for (const value of values) {
      const key = keyof(value, ++index, values);
      const group = groups.get(key);
      if (group) group.push(value);
      else groups.set(key, [value]);
    }
    for (const [key, values] of groups) {
      groups.set(key, regroup(values, i));
    }
    return map(groups);
  })(values, 0);
}

function rollup(values, reduce, ...keys) {
  return nest(values, identity, reduce, keys);
}

function group(values, ...keys) {
  return nest(values, identity, identity, keys);
}

function groups(values, ...keys) {
  return nest(values, Array.from, identity, keys);
}




function greatest(values, compare = ascending) {
  let max;
  let defined = false;
  if (compare.length === 1) {
    let maxValue;
    for (const element of values) {
      const value = compare(element);
      if (defined
          ? ascending(value, maxValue) > 0
          : ascending(value, value) === 0) {
        max = element;
        maxValue = value;
        defined = true;
      }
    }
  } else {
    for (const value of values) {
      if (defined
          ? compare(value, max) > 0
          : compare(value, value) === 0) {
        max = value;
        defined = true;
      }
    }
  }
  return max;
}

function ascending(a, b) {
  return a < b ? -1 : a > b ? 1 : a >= b ? 0 : NaN;
}




  