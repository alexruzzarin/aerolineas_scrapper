const blessed = require('blessed');
const contrib = require('blessed-contrib');
const format = require('date-format');

class Dashboard {

  constructor () {
    this.widgets = {};

    // Configure blessed
    this.screen = blessed.screen({
      title: 'Aerolineas Dashboard',
      autoPadding: true,
      dockBorders: true,
      fullUnicode: true,
      smartCSR: true
    });

    this.screen.key(['escape', 'q', 'C-c'], (ch, key) => process.exit(0));

    // Grid settings
    this.grid = new contrib.grid({
      screen: this.screen,
      rows: 12,
      cols: 12
    });

    // Graphs
    this.graphs = {
      flight: {
        title: 'Prices',
        x: [],
        y: [],
        style: {
          line: 'yellow'
        }
      }
    };

    // Shared settings
    const shared = {
      border: {
        type: 'line'
      },
      style: {
        fg: 'blue',
        text: 'blue',
        border: {
          fg: 'green'
        }
      }
    };

    // Widgets
    const widgets = {
      graph: {
        type: contrib.line,
        size: {
          width: 12,
          height: 6,
          top: 0,
          left: 0
        },
        options: Object.assign({}, shared, {
          label: 'Prices',
          showLegend: true,
          legend: {
            width: 8
          }
        })
      },
      log: {
        type: contrib.log,
        size: {
          width: 12,
          height: 6,
          top: 6,
          left: 0
        },
        options: Object.assign({}, shared, {
          label: 'Log',
          padding: {
            left: 1
          }
        })
      }
    };

    for (let name in widgets) {
      let widget = widgets[name];

      this.widgets[name] = this.grid.set(
        widget.size.top,
        widget.size.left,
        widget.size.height,
        widget.size.width,
        widget.type,
        widget.options
      );
    }
  }

  render () {
    this.screen.render();
  }

  plot (price) {
    const now = format('dd hh:mm', new Date());

    Object.assign(this.graphs.flight, {
      x: [...this.graphs.flight.x, now],
      y: [...this.graphs.flight.y, price]
    });

    this.widgets.graph.setData([
      this.graphs.flight
    ]);
  }

  log (messages) {
    const now = format('dd/MM hh:mm', new Date());
    messages.forEach((m) => this.widgets.log.log(`${now}: ${m}`));
  }
}

module.exports = Dashboard;
