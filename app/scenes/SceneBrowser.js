alert('SceneSceneBrowser.js loaded');

SceneSceneBrowser.ItemsLimit = 100;
SceneSceneBrowser.ColumnsCount = 4;

SceneSceneBrowser.MODE_NONE = -1;
SceneSceneBrowser.MODE_ALL = 1;
SceneSceneBrowser.MODE_GENRE_MENU = 2;
SceneSceneBrowser.MODE_GENRE_SPECIFIC = 20;
SceneSceneBrowser.MODE_ARTIST_MENU = 3;
SceneSceneBrowser.MODE_ARTIST_SPECIFIC = 30;
SceneSceneBrowser.MODE_PLAYLIST_MENU = 4;

SceneSceneBrowser.MODE_DISPLAY_ART = 90;
SceneSceneBrowser.MODE_DISPLAY_PLAYLIST = 91;

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

SceneSceneBrowser.allArtData = null;

SceneSceneBrowser.allTimeouts = [];
SceneSceneBrowser.playlistIntervalTime = 30000;

SceneSceneBrowser.currentPlaylistName = null;

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
    if (element === null) {
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

  return $('<td id="cell_' + row_id + '_' + column_id + '" class="art_cell" data-channelname="' + data_name + '" data-artistname="' + info + '"></td>').html(
              '<img id="thumbnail_' + row_id + '_' + column_id + '" class="art_thumbnail" src="' + thumbnail + '"/> \
              <div class="art_text" ' + infostyle + '> <div class="art_title">' + title + '</div> \
              <div class="art_info">' + info + '</div> <div class="art_info">' + info2 + '</div> </div>');
};

SceneSceneBrowser.createCellEmpty = function() {
  return $('<td class="art_cell"></td>').html('');
};

SceneSceneBrowser.loadDataError = function() {
  alert(".loadDataError called");
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

  alert(".displayArt called with " + artURL);

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
    } else {
      $("#single-piece").width("100%");
      $("#display-art").width("100%");
    }
    $("#single-piece-wrapper").show();
  });
};

SceneSceneBrowser.displayPlaylist = function(playlistName) {
  // Handles displaying a "playlist", which is really just a setInterval changing which piece
  // is being displayed with .displayArt() above
  alert(".displayPlaylist called for " + playlistName);
  bodyToFilter = SceneSceneBrowser.allArtData.playlists;
  var artSlugsList = null;
  for (var ind = 0; ind < bodyToFilter.length; ind++) {
    if (bodyToFilter[ind].playlist_name == playlistName) {
      alert("Found playlist name " + playlistName);
      artSlugsList = bodyToFilter[ind].contents;
    }
  }

  var artList = [];
  $.each(artSlugsList, function(ind, val) {
    artList.push(SceneSceneBrowser.findURLbyID(val));
  });

  var ind2 = 1,
      totalMod = artList.length;

  SceneSceneBrowser.displayArt(artList[ind2]);
  SceneSceneBrowser.playlistInterval = setInterval(function(){
    ind2++;
    alert('Playlist loop! ' + ind2);
    SceneSceneBrowser.displayArt(artList[(ind2 % totalMod)]);
  }, SceneSceneBrowser.playlistIntervalTime);
};

SceneSceneBrowser.hideArt = function() {
  // Hides the art to exit 'full-screen' mode; doesn't do too much right now
  // but potential to move stuff from switchMode or elsewhere to here
  alert(".hideArt called");
  $("#single-piece-wrapper").hide();
};

SceneSceneBrowser.findURLbyID = function(artID) {
  alert(".findURLbyID called for " + artID);
  allArt = SceneSceneBrowser.allArtData.art;
  for (var ind = 0; ind < allArt.length; ind++) {
    if (allArt[ind].uid === artID) {
      return allArt[ind].url;
    }
  }
};

SceneSceneBrowser.filterByCriteria = function(filterKey, filterValue) {
  // Helper function that will look through the entire list of "art" in art.json and pull out entries
  // with filterValue in the filterKey. Good for "filtering" by genre or artist.
  alert(".filterByCriteria called for key " + filterKey + " and filterValue " + filterValue);
  bodyToFilter = SceneSceneBrowser.allArtData.art;
  var results = {"art": []};
  for (var ind = 0; ind < bodyToFilter.length; ind++) {
    if (bodyToFilter[ind][filterKey] === filterValue) {
      results.art.push(bodyToFilter[ind]);
    }
  }
  return results;
};

SceneSceneBrowser.loadDataSuccess = function() {
  alert(".loadDataSuccess called");
  var response_items;

  if (SceneSceneBrowser.mode === SceneSceneBrowser.MODE_GENRE_SPECIFIC) {
    response = SceneSceneBrowser.filterByCriteria("genre", SceneSceneBrowser.genreSelected);
  } else if (SceneSceneBrowser.mode === SceneSceneBrowser.MODE_ARTIST_SPECIFIC) {
    response = SceneSceneBrowser.filterByCriteria("artist", SceneSceneBrowser.artistSelected);
  } else {
    response = SceneSceneBrowser.allArtData;
  }

  if (SceneSceneBrowser.mode === SceneSceneBrowser.MODE_ALL) {
    response_items = response.art.length;
  } else if (SceneSceneBrowser.mode === SceneSceneBrowser.MODE_GENRE_MENU) {
    response_items = response.genres.length;
  } else if (SceneSceneBrowser.mode === SceneSceneBrowser.MODE_ARTIST_MENU) {
    response_items = response.artist.length;
  } else if (SceneSceneBrowser.mode === SceneSceneBrowser.MODE_PLAYLIST_MENU) {
    response_items = response.playlists.length;
  } else {
    response_items = response.art.length;
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
      var cell, style;

      if (SceneSceneBrowser.mode == SceneSceneBrowser.MODE_ALL || SceneSceneBrowser.mode == SceneSceneBrowser.MODE_GENRE_SPECIFIC || SceneSceneBrowser.mode == SceneSceneBrowser.MODE_ARTIST_SPECIFIC) {
        style = response.art[cursor];
        cell = SceneSceneBrowser.createCell(row_id, t, style.name, style.url, style.name, style.artist, '', true);
      } else if (SceneSceneBrowser.mode == SceneSceneBrowser.MODE_GENRE_MENU) {
        // When we load the "genres" section of art.json, each listing doesn't have artist info, and 'style.name' is the name of the genre
        style = response.genres[cursor];
        coverURL = SceneSceneBrowser.findURLbyID(style.cover_piece);
        cell = SceneSceneBrowser.createCell(row_id, t, style.name, coverURL, style.name, '', '', true);
      } else if (SceneSceneBrowser.mode == SceneSceneBrowser.MODE_ARTIST_MENU) {
        // When we load the "artist" section of art.json, each listing doesn't have genre info, and 'style.name' is the name of the artist
        style = response.artist[cursor];
        coverURL = SceneSceneBrowser.findURLbyID(style.cover_piece);
        cell = SceneSceneBrowser.createCell(row_id, t, style.name, coverURL, '', style.name, '', true);
      } else if (SceneSceneBrowser.mode == SceneSceneBrowser.MODE_PLAYLIST_MENU) {
        style = response.playlists[cursor];
        coverURL = style.icon;
        cell = SceneSceneBrowser.createCell(row_id, t, style.playlist_name, coverURL, style.playlist_name, '', '', true);
      }

      row.append(cell);
    }

    for (; t < SceneSceneBrowser.ColumnsCount; t++) {
      row.append(SceneSceneBrowser.createCellEmpty());
    }

    $('#art_table').append(row);
  }

  sleep(250, function() {
    SceneSceneBrowser.addFocus();
    SceneSceneBrowser.showTable();
    SceneSceneBrowser.loadingData = false;
  });
};

SceneSceneBrowser.loadDataRequest = function() {
  alert(".loadDataRequest called");
  if (SceneSceneBrowser.allArtData !== null) {
    SceneSceneBrowser.loadDataSuccess();
  } else {
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
              alert("xmlHttp.responseText loaded in .loadDataRequest()");
              SceneSceneBrowser.allArtData = $.parseJSON(xmlHttp.responseText);  // Saving the entire art.json to the object saves load time
              SceneSceneBrowser.loadDataSuccess();
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
  }
};

SceneSceneBrowser.loadData = function() {
  alert(".loadData called");
  // Even though loading data after end is safe it is pointless and causes lag
  if ((SceneSceneBrowser.itemsCount % SceneSceneBrowser.ColumnsCount !== 0) || SceneSceneBrowser.loadingData) {
    return;
  }

  if (SceneSceneBrowser.mode == SceneSceneBrowser.MODE_DISPLAY_ART) {
    SceneSceneBrowser.displayArt(SceneSceneBrowser.currentPieceURL);
  } else if (SceneSceneBrowser.mode == SceneSceneBrowser.MODE_DISPLAY_PLAYLIST) {
    SceneSceneBrowser.displayPlaylist(SceneSceneBrowser.currentPlaylistName);
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
  alert(".switchMode called; previous mode " + SceneSceneBrowser.mode + " and new desired mode is " + mode);
  if (mode != SceneSceneBrowser.mode) {
    SceneSceneBrowser.mode = mode;

    $("#tip_icon_playlists").removeClass('tip_icon_active');
    $("#tip_icon_genres").removeClass('tip_icon_active');
    $("#tip_icon_artist").removeClass('tip_icon_active');
    $("#tip_icon_all").removeClass('tip_icon_active');

    if (mode == SceneSceneBrowser.MODE_ALL) {
      $("#tip_icon_all").addClass('tip_icon_active');
      SceneSceneBrowser.refresh();
    } else if (mode == SceneSceneBrowser.MODE_GENRE_MENU) {
      $("#tip_icon_genres").addClass('tip_icon_active');
      SceneSceneBrowser.refresh();
    }  else if (mode == SceneSceneBrowser.MODE_ARTIST_MENU) {
      $("#tip_icon_artist").addClass('tip_icon_active');
      SceneSceneBrowser.refresh();
    } else if (mode == SceneSceneBrowser.MODE_PLAYLIST_MENU) {
      $("#tip_icon_playlists").addClass('tip_icon_active');
      SceneSceneBrowser.refresh();
    }
  }
};

SceneSceneBrowser.clean = function() {
  alert(".clean called");
  $('#art_table').empty();
  SceneSceneBrowser.itemsCount = 0;
  SceneSceneBrowser.cursorX = 0;
  SceneSceneBrowser.cursorY = 0;
  SceneSceneBrowser.dataEnded = false;
};

SceneSceneBrowser.refresh = function() {
  alert(".refresh was called; mode is currently " + SceneSceneBrowser.mode);
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

  if (SceneSceneBrowser.cursorY === 0) {
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
  $('.label_channels').html(STR_PLAYLISTS);
  $('.label_styles').html(STR_GENRES);
  $('.label_open').html(STR_ARTIST);
  $('.label_refresh').html(STR_All);
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
  alert("SceneSceneBrowser.handleKeyDown(" + keyCode + ") SceneSceneBrowser.mode is " + SceneSceneBrowser.mode);

  // When the app is in "display single piece / playlist" mode and the user presses any button,
  // he should return to the main screen
  if (SceneSceneBrowser.mode == SceneSceneBrowser.MODE_DISPLAY_ART || SceneSceneBrowser.mode == SceneSceneBrowser.MODE_DISPLAY_PLAYLIST) {
    clearInterval(SceneSceneBrowser.playlistInterval);

    SceneSceneBrowser.hideArt();
    SceneSceneBrowser.switchMode(SceneSceneBrowser.MODE_ALL);
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
      if (SceneSceneBrowser.mode == SceneSceneBrowser.MODE_ALL || SceneSceneBrowser.mode == SceneSceneBrowser.MODE_GENRE_SPECIFIC ||
        SceneSceneBrowser.mode == SceneSceneBrowser.MODE_ARTIST_SPECIFIC) {
        SceneSceneBrowser.styleSelected = $('#cell_' + SceneSceneBrowser.cursorY + '_' + SceneSceneBrowser.cursorX).attr('data-channelname');
        SceneSceneBrowser.mode = SceneSceneBrowser.MODE_DISPLAY_ART;
        SceneSceneBrowser.currentPieceURL = $('#thumbnail_' + SceneSceneBrowser.cursorY + '_' + SceneSceneBrowser.cursorX).attr('src');
        alert("Art URL is " + $('#thumbnail_' + SceneSceneBrowser.cursorY + '_' + SceneSceneBrowser.cursorX).attr('src'));
        SceneSceneBrowser.refresh();
      } else if (SceneSceneBrowser.mode == SceneSceneBrowser.MODE_GENRE_MENU) {
        SceneSceneBrowser.genreSelected = $('#cell_' + SceneSceneBrowser.cursorY + '_' + SceneSceneBrowser.cursorX).attr('data-channelname');
        SceneSceneBrowser.mode = SceneSceneBrowser.MODE_GENRE_SPECIFIC;
        alert("Specific Genre chosen: " + SceneSceneBrowser.genreSelected);
        SceneSceneBrowser.refresh();
      } else if (SceneSceneBrowser.mode == SceneSceneBrowser.MODE_ARTIST_MENU) {
        SceneSceneBrowser.artistSelected = $('#cell_' + SceneSceneBrowser.cursorY + '_' + SceneSceneBrowser.cursorX).attr('data-artistname');
        SceneSceneBrowser.mode = SceneSceneBrowser.MODE_ARTIST_SPECIFIC;
        alert("Specific Artist chosen: " + SceneSceneBrowser.artistSelected);
        SceneSceneBrowser.refresh();
      } else if (SceneSceneBrowser.mode == SceneSceneBrowser.MODE_PLAYLIST_MENU) {
        SceneSceneBrowser.currentPlaylistName = $('#cell_' + SceneSceneBrowser.cursorY + '_' + SceneSceneBrowser.cursorX).attr('data-channelname');
        SceneSceneBrowser.mode = SceneSceneBrowser.MODE_DISPLAY_PLAYLIST;
        alert("Specific Playlist chosen: " + SceneSceneBrowser.currentPlaylistName);
        SceneSceneBrowser.refresh();
      }
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
      SceneSceneBrowser.switchMode(SceneSceneBrowser.MODE_PLAYLIST_MENU);
      break;
    case sf.key.GREEN:
      SceneSceneBrowser.switchMode(SceneSceneBrowser.MODE_GENRE_MENU);
      break;
    case sf.key.YELLOW:
      SceneSceneBrowser.switchMode(SceneSceneBrowser.MODE_ARTIST_MENU);
      break;
    case sf.key.BLUE:
      SceneSceneBrowser.switchMode(SceneSceneBrowser.MODE_ALL);
      break;
    default:
      alert("handle default key event, key code(" + keyCode + ")");
      break;
  }
};

function onCompleteText(string) {

}
