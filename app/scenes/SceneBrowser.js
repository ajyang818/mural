alert('SceneSceneBrowser.js loaded');

SceneSceneBrowser.ItemsLimit = 100;
SceneSceneBrowser.ColumnsCount = 4;

SceneSceneBrowser.MODE_NONE = -1;
SceneSceneBrowser.MODE_ALL = 1; // [JR: used to be 0]
SceneSceneBrowser.MODE_STYLES = 1;
// SceneSceneBrowser.MODE_STYLES_STYLES = 2;  // Removing this mode for now
// SceneSceneBrowser.MODE_GO = 3;  // Removing this mode for now
SceneSceneBrowser.MODE_DISPLAY_ART = 99;

SceneSceneBrowser.mode = SceneSceneBrowser.MODE_NONE;
SceneSceneBrowser.styleSelected = null;
SceneSceneBrowser.itemsCount = 0;
SceneSceneBrowser.cursorX = 0;
SceneSceneBrowser.cursorY = 0;

SceneSceneBrowser.ime = null;

SceneSceneBrowser.loadingData = false;
SceneSceneBrowser.loadingDataTryMax = 15;
SceneSceneBrowser.loadingDataTry;
SceneSceneBrowser.loadingDataTimeout;
SceneSceneBrowser.dataEnded = false;

var ScrollHelper = {
  documentVerticalScrollPosition: function() {
    if (self.pageYOffset) return self.pageYOffset; // Firefox, Chrome, Opera, Safari.
    if (document.documentElement && document.documentElement.scrollTop) return document.documentElement.scrollTop; // Internet Explorer 6 (standards mode).
    if (document.body.scrollTop) return document.body.scrollTop; // Internet Explorer 6, 7 and 8.
    return 0; // None of the above.
  },

  viewportHeight: function() {
    return (document.compatMode === "CSS1Compat") ? document.documentElement.clientHeight : document.body.clientHeight;
  },

  documentHeight: function() {
    return (document.height !== undefined) ? document.height : document.body.offsetHeight;
  },

  documentMaximumScrollPosition: function() {
    return this.documentHeight() - this.viewportHeight();
  },

  elementVerticalClientPositionById: function(id) {
    var element = document.getElementById(id);
    var rectangle = element.getBoundingClientRect();
    return rectangle.top;
  },

  /**
   * For public use.
   *
   * @param id The id of the element to scroll to.
   * @param padding Top padding to apply above element.
   */
  scrollVerticalToElementById: function(id, padding) {
    var element = document.getElementById(id);
    if (element == null) {
      console.warn('Cannot find element with id \'' + id + '\'.');
      return;
    }

    var targetPosition = this.documentVerticalScrollPosition() + this.elementVerticalClientPositionById(id) - 0.25 * this.viewportHeight() - padding;

    $(window).scrollTop(targetPosition);
  }
};

function addCommas(nStr) {
  nStr += '';
  x = nStr.split('.');
  x1 = x[0];
  x2 = x.length > 1 ? '.' + x[1] : '';
  var rgx = /(\d+)(\d{3})/;
  while (rgx.test(x1)) {
    x1 = x1.replace(rgx, '$1' + ',' + '$2');
  }
  return x1 + x2;
}

function sleep(millis, callback) {
  setTimeout(function() {
    callback();
  }, millis);
}

SceneSceneBrowser.createCell = function(row_id, column_id, data_name, thumbnail, title, info, info2, info_fill) {
  var infostyle = info_fill ? 'style="right: 0;"' : 'style="right: 20%;"';

  return $('<td id="cell_' + row_id + '_' + column_id + '" class="art_cell" data-channelname="' + data_name + '"></td>').html(
              '<img id="thumbnail_' + row_id + '_' + column_id + '" class="art_thumbnail" src="' + thumbnail + '"/> \
              <div class="art_text" ' + infostyle + '> <div class="art_title">' + title + '</div> \
              <div class="art_info">' + info + '</div> <div class="art_info">' + info2 + '</div> </div>');
};

SceneSceneBrowser.createCellEmpty = function() {
  return $('<td class="art_cell"></td>').html('');
};

SceneSceneBrowser.loadDataError = function() {
  SceneSceneBrowser.loadingDataTry++;
  if (SceneSceneBrowser.loadingDataTry < SceneSceneBrowser.loadingDataTryMax) {
    if (SceneSceneBrowser.loadingDataTry < 10) {
      SceneSceneBrowser.loadingDataTimeout += 100;
    } else {
      switch (SceneSceneBrowser.loadingDataTry) {
        case 10:
          SceneSceneBrowser.loadingDataTimeout = 5000;
          break;
        case 11:
          SceneSceneBrowser.loadingDataTimeout = 10000;
          break;
        case 12:
          SceneSceneBrowser.loadingDataTimeout = 30000;
          break;
        case 13:
          SceneSceneBrowser.loadingDataTimeout = 60000;
          break;
        default:
          SceneSceneBrowser.loadingDataTimeout = 300000;
          break;
      }
    }
    SceneSceneBrowser.loadDataRequest();
  } else {
    SceneSceneBrowser.loadingData = false;
    SceneSceneBrowser.showDialog("Error: Unable to load art data.");
  }
};

SceneSceneBrowser.displayArt = function(artURL) {
  // Handles rendering of a chosen piece (from source artURL) in the "#single-piece" div,
  // which is usually hidden but will display above the menu.

  // Clear whatever piece may have been previously shown
  $("#single-piece").empty();
  $("#single-piece").css("height", null);
  $("#single-piece").css("width", null);

  // Add a placeholder for the piece
  $("#single-piece").append('<img id="display-art" />');

  // Load the piece, but scale the image to full-screen after it's loaded
  var imgLoad = $("#display-art");
  imgLoad.attr("src", artURL);
  imgLoad.unbind("load");
  imgLoad.bind("load", function () {
    var artHeight = this.height,
        artWidth = this.width,
        wrapperHeight = $("#single-piece-wrapper").height(),
        wrapperWidth = $("#single-piece-wrapper").width(),
        artRatio = artHeight / artWidth,
        wrapperRatio = wrapperHeight / wrapperWidth;

    // To determine whether to make the height or width 100% of the container,
    // we need to compare the ratio of height to width
    if (artRatio > wrapperRatio) {
      $("#single-piece").height("100%");
      $("#display-art").height("100%");
      alert("ALLEN: height set to 100%");
    } else {
      $("#single-piece").width("100%");
      $("#display-art").width("100%");
      alert("ALLEN: width set to 100%");
    }
    $("#single-piece-wrapper").show();
  });
};

SceneSceneBrowser.hideArt = function() {
  // Hides the art to exit 'full-screen' mode; doesn't do too much right now
  // but potential to move stuff from switchMode or elsewhere to here
  $("#single-piece-wrapper").hide();
  alert("ALLEN: .hideArt activated");
};

SceneSceneBrowser.loadDataSuccess = function(responseText) {
  var response = $.parseJSON(responseText);
  var response_items;

  if (SceneSceneBrowser.mode === SceneSceneBrowser.MODE_STYLES) {
    response_items = response.top.length;
  } else {
    response_items = response.arts.length;
  }

  if (response_items < SceneSceneBrowser.ItemsLimit) {
    SceneSceneBrowser.dataEnded = true;
  }

  var offset = SceneSceneBrowser.itemsCount;
  SceneSceneBrowser.itemsCount += response_items;

  var response_rows = response_items / SceneSceneBrowser.ColumnsCount;
  if (response_items % SceneSceneBrowser.ColumnsCount > 0) {
    response_rows++;
  }

  var cursor = 0;

  var t;
  for (var i = 0; i < response_rows; i++) {
    var row_id = offset / SceneSceneBrowser.ColumnsCount + i;
    var row = $('<tr></tr>');

    for (t = 0; t < SceneSceneBrowser.ColumnsCount && cursor < response_items; t++, cursor++) {
      var cell;

      if (SceneSceneBrowser.mode == SceneSceneBrowser.MODE_STYLES) {
        var style = response.top[cursor];
        cell = SceneSceneBrowser.createCell(row_id, t, style.name, style.url, style.name, style.artist, '', true);
      }  // There used to be an 'else' clause here, removed 3/31/15 because it seemed to do with Twitch channel viewers

      row.append(cell);
    }

    for (; t < SceneSceneBrowser.ColumnsCount; t++) {
      row.append(SceneSceneBrowser.createCellEmpty());
    }

    $('#art_table').append(row);
  }

  sleep(2000, function() {
    SceneSceneBrowser.showTable();
    SceneSceneBrowser.addFocus();
    SceneSceneBrowser.loadingData = false;
  });
};

SceneSceneBrowser.loadDataRequest = function() {
  try {
    var dialog_title = "";
    if (SceneSceneBrowser.loadingDataTry > 0) {
      dialog_title = STR_RETRYING + " (" + (SceneSceneBrowser.loadingDataTry + 1) + "/" + SceneSceneBrowser.loadingDataTryMax + ")";
    }
    SceneSceneBrowser.showDialog(dialog_title);

    var xmlHttp = new XMLHttpRequest(),
        theUrl = 'art.json';

    xmlHttp.ontimeout = function() {};
    xmlHttp.onreadystatechange = function() {
      if (xmlHttp.readyState === 4) {
        if (xmlHttp.status === 200) {
          try {
            // console.log(xmlHttp.responseText);
            alert("xmlHttp.responseText loaded in .loadDataRequest()");
            SceneSceneBrowser.loadDataSuccess(xmlHttp.responseText);
          } catch (err) {
            SceneSceneBrowser.showDialog("loadDataSuccess() exception: " + err.name + ' ' + err.message);
          }

        } else {
          SceneSceneBrowser.loadDataError();
        }
      }
    };
    xmlHttp.open("GET", theUrl, true);
    xmlHttp.timeout = SceneSceneBrowser.loadingDataTimeout;
    xmlHttp.send(null);
  } catch (error) {
    SceneSceneBrowser.loadDataError();
  }
};

SceneSceneBrowser.loadData = function() {
  // Even though loading data after end is safe it is pointless and causes lag
  if ((SceneSceneBrowser.itemsCount % SceneSceneBrowser.ColumnsCount != 0) || SceneSceneBrowser.loadingData) {
    return;
  }

  if (SceneSceneBrowser.mode == SceneSceneBrowser.MODE_DISPLAY_ART) {
    SceneSceneBrowser.displayArt(SceneSceneBrowser.currentPieceURL);
  } else {
    SceneSceneBrowser.loadingData = true;
    SceneSceneBrowser.loadingDataTry = 0;
    SceneSceneBrowser.loadingDataTimeout = 500;

    SceneSceneBrowser.loadDataRequest();
  }
};

SceneSceneBrowser.showDialog = function(title) {
  $("#artname_frame").hide();
  $("#art_table").hide();
  $("#dialog_loading_text").text(title);
  $("#dialog_loading").show();
};

SceneSceneBrowser.showTable = function() {
  $("#dialog_loading").hide();
  $("#artname_frame").hide();
  $("#art_table").show();

  ScrollHelper.scrollVerticalToElementById('thumbnail_' + SceneSceneBrowser.cursorY + '_' + SceneSceneBrowser.cursorX, 0);
};

SceneSceneBrowser.showInput = function() {
  $("#dialog_loading").hide();
  $("#art_table").hide();
  $("#artname_frame").show();
};

SceneSceneBrowser.switchMode = function(mode) {
  alert("ALLEN: .switchMode called; previous mode " + SceneSceneBrowser.mode + " and new desired mode is " + mode);
  if (mode != SceneSceneBrowser.mode) {
    SceneSceneBrowser.mode = mode;

    $("#tip_icon_channels").removeClass('tip_icon_active');
    $("#tip_icon_styles").removeClass('tip_icon_active');
    $("#tip_icon_open").removeClass('tip_icon_active');
    $("#tip_icon_refresh").removeClass('tip_icon_active');

    if (mode == SceneSceneBrowser.MODE_ALL) {
      $("#tip_icon_channels").addClass('tip_icon_active');
      SceneSceneBrowser.refresh();
    } else if (mode == SceneSceneBrowser.MODE_STYLES) {
      $("#tip_icon_styles").addClass('tip_icon_active');
      SceneSceneBrowser.refresh();
    }  // Removed MODE_STYLES_STYLES and MODE_GO else if condition
  }
};

SceneSceneBrowser.clean = function() {
  $('#art_table').empty();
  SceneSceneBrowser.itemsCount = 0;
  SceneSceneBrowser.cursorX = 0;
  SceneSceneBrowser.cursorY = 0;
  SceneSceneBrowser.dataEnded = false;
};

SceneSceneBrowser.refresh = function() {
  alert("ALLEN: .refresh was called; mode is currently " + SceneSceneBrowser.mode);
  SceneSceneBrowser.clean();
  SceneSceneBrowser.loadData();
};


SceneSceneBrowser.removeFocus = function() {
  $('#thumbnail_' + SceneSceneBrowser.cursorY + '_' + SceneSceneBrowser.cursorX).removeClass('art_thumbnail_focused');
};

SceneSceneBrowser.addFocus = function() {
  if (SceneSceneBrowser.cursorY + 5 > SceneSceneBrowser.itemsCount / SceneSceneBrowser.ColumnsCount && !SceneSceneBrowser.dataEnded) {
    SceneSceneBrowser.loadData();
  }

  $('#thumbnail_' + SceneSceneBrowser.cursorY + '_' + SceneSceneBrowser.cursorX).addClass('art_thumbnail_focused');

  ScrollHelper.scrollVerticalToElementById('thumbnail_' + SceneSceneBrowser.cursorY + '_' + SceneSceneBrowser.cursorX, 0);
};

SceneSceneBrowser.getCellsCount = function(posY) {
  return Math.min(
    SceneSceneBrowser.ColumnsCount,
    SceneSceneBrowser.itemsCount - posY * SceneSceneBrowser.ColumnsCount);
};

SceneSceneBrowser.getRowsCount = function() {
  var count = SceneSceneBrowser.itemsCount / SceneSceneBrowser.ColumnsCount;
  if (SceneSceneBrowser.itemsCount % SceneSceneBrowser.ColumnsCount > 0) {
    count++;
  }

  return count;
};

SceneSceneBrowser.refreshInputFocus = function() {
  $('#artname_input').removeClass('channelname');
  $('#artname_input').removeClass('channelname_focused');
  $('#artname_button').removeClass('button_go');
  $('#artname_button').removeClass('button_go_focused');

  if (SceneSceneBrowser.cursorY == 0) {
    $('#artname_input').addClass('channelname_focused');
    $('#artname_button').addClass('button_go');
  } else {
    $('#artname_input').addClass('channelname');
    $('#artname_button').addClass('button_go_focused');
  }
};

function SceneSceneBrowser() {

};

SceneSceneBrowser.initLanguage = function() {
  //set correct labels
  $('.label_channels').html(STR_CHANNELS);
  $('.label_styles').html(STR_STYLES);
  $('.label_open').html(STR_OPEN);
  $('.label_refresh').html(STR_REFRESH);
  $('.label_placeholder_open').attr("placeholder", STR_PLACEHOLDER_OPEN);
};


SceneSceneBrowser.prototype.initialize = function() {
  alert("SceneSceneBrowser.initialize()");
  // this function will be called only once when the scene manager show this scene first time
  // initialize the scene controls and styles, and initialize your variables here
  // scene HTML and CSS will be loaded before this function is called

  SceneSceneBrowser.initLanguage();

  SceneSceneBrowser.loadingData = false;

  SceneSceneBrowser.switchMode(SceneSceneBrowser.MODE_ALL);
};


SceneSceneBrowser.prototype.handleShow = function(data) {
  alert("SceneSceneBrowser.handleShow()");
  // this function will be called when the scene manager show this scene
};

SceneSceneBrowser.prototype.handleHide = function() {
  alert("SceneSceneBrowser.handleHide()");
  // this function will be called when the scene manager hide this scene
  SceneSceneBrowser.clean();
};

SceneSceneBrowser.prototype.handleFocus = function() {
  alert("SceneSceneBrowser.handleFocus()");
  // this function will be called when the scene manager focus this scene
  SceneSceneBrowser.refresh();
};

SceneSceneBrowser.prototype.handleBlur = function() {
  alert("SceneSceneBrowser.handleBlur()");
  // this function will be called when the scene manager move focus to another scene from this scene
};

SceneSceneBrowser.prototype.handleKeyDown = function(keyCode) {
  alert("SceneSceneBrowser.handleKeyDown(" + keyCode + ")");
  alert("ALLEN: SceneSceneBrowser.mode is " + SceneSceneBrowser.mode);

  // Removed if condition for .MODE_STYLES_STYLES; removed 3/31/2015

  // When the app is in "display single piece" mode and the user presses any button,
  // he should return to the main screen
  if (SceneSceneBrowser.mode == SceneSceneBrowser.MODE_DISPLAY_ART) {
    SceneSceneBrowser.hideArt();
    SceneSceneBrowser.switchMode(SceneSceneBrowser.MODE_STYLES);
    // SceneSceneBrowser.refresh();  // I think .switchMode already does this
    return;
  }

  if (SceneSceneBrowser.loadingData) {
    return;
  }

  switch (keyCode) {
    case sf.key.LEFT:
      if (SceneSceneBrowser.cursorX > 0) {
        SceneSceneBrowser.removeFocus();
        SceneSceneBrowser.cursorX--;
        SceneSceneBrowser.addFocus();
      }
      break;
    case sf.key.RIGHT:
      if (SceneSceneBrowser.cursorX < SceneSceneBrowser.getCellsCount(SceneSceneBrowser.cursorY) - 1) {
        SceneSceneBrowser.removeFocus();
        SceneSceneBrowser.cursorX++;
        SceneSceneBrowser.addFocus();
      }
      break;
    case sf.key.UP:
      if (SceneSceneBrowser.cursorY > 0) {
        SceneSceneBrowser.removeFocus();
        SceneSceneBrowser.cursorY--;
        SceneSceneBrowser.addFocus();
      }
      break;
    case sf.key.DOWN:
      if (SceneSceneBrowser.cursorY < SceneSceneBrowser.getRowsCount() - 1 && SceneSceneBrowser.cursorX < SceneSceneBrowser.getCellsCount(SceneSceneBrowser.cursorY + 1)) {
        SceneSceneBrowser.removeFocus();
        SceneSceneBrowser.cursorY++;
        SceneSceneBrowser.addFocus();
      }
      break;
    case sf.key.ENTER:
      // Originally there was a large if condition here for MODE_GO
      if (SceneSceneBrowser.mode == SceneSceneBrowser.MODE_STYLES) {
        SceneSceneBrowser.styleSelected = $('#cell_' + SceneSceneBrowser.cursorY + '_' + SceneSceneBrowser.cursorX).attr('data-channelname');
        SceneSceneBrowser.mode = SceneSceneBrowser.MODE_DISPLAY_ART;
        SceneSceneBrowser.currentPieceURL = $('#thumbnail_' + SceneSceneBrowser.cursorY + '_' + SceneSceneBrowser.cursorX).attr('src');
        alert("ALLEN: Art URL is " + $('#thumbnail_' + SceneSceneBrowser.cursorY + '_' + SceneSceneBrowser.cursorX).attr('src'));
        SceneSceneBrowser.refresh();
      }  // There used to be an else condition here to invoke .openStream(); removed 3/31/2015
      break;
    case sf.key.VOL_UP:
      sf.service.setVolumeControl(true);
      break;
    case sf.key.VOL_DOWN:
      sf.service.setVolumeControl(true);
      break;
    case sf.key.MUTE:
      sf.service.setVolumeControl(true);
      break;
    case sf.key.RED:
      SceneSceneBrowser.switchMode(SceneSceneBrowser.MODE_ALL);
      break;
    case sf.key.GREEN:
      SceneSceneBrowser.switchMode(SceneSceneBrowser.MODE_STYLES);
      break;
    case sf.key.YELLOW:
      SceneSceneBrowser.switchMode(SceneSceneBrowser.MODE_STYLES);
      // SceneSceneBrowser.switchMode(SceneSceneBrowser.MODE_GO);  // Removing GO mode for now
      break;
    case sf.key.BLUE:
      SceneSceneBrowser.refresh();
      break;
    default:
      alert("handle default key event, key code(" + keyCode + ")");
      break;
  }
};

function onCompleteText(string) {

}
