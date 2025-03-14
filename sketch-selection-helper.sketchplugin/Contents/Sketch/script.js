// Sketch Selection Helper
// A plugin to copy selection IDs for use with Sketch Context MCP

var onRun = function(context) {
  try {
    var selection = context.selection;
    var doc = context.document;
    
    if (selection.count() === 0) {
      doc.showMessage("Please select at least one layer");
      return;
    }
    
    var ids = [];
    for (var i = 0; i < selection.count(); i++) {
      try {
        var layer = selection.objectAtIndex(i);
        ids.push({
          id: layer.objectID(),
          name: layer.name(),
          type: layer.className(),
          // Add more useful properties for the MCP server
          frame: {
            x: layer.frame().x(),
            y: layer.frame().y(),
            width: layer.frame().width(),
            height: layer.frame().height()
          }
        });
      } catch (layerError) {
        log("Error processing layer: " + layerError);
      }
    }
    
    // Format the data for clipboard
    var jsonData = JSON.stringify(ids, null, 2);
    
    // Copy to clipboard
    try {
      var pasteBoard = NSPasteboard.generalPasteboard();
      pasteBoard.clearContents();
      pasteBoard.setString_forType_(jsonData, NSPasteboardTypeString);
      
      // Show success message with count
      doc.showMessage(selection.count() + " layer(s) copied to clipboard! Use these IDs with Sketch Context MCP.");
      
      // Log to console for debugging
      log("Selection IDs copied to clipboard:");
      log(jsonData);
    } catch (clipboardError) {
      log("Error copying to clipboard: " + clipboardError);
      doc.showMessage("Error copying to clipboard: " + clipboardError);
    }
  } catch (error) {
    log("Plugin error: " + error);
    context.document.showMessage("Plugin error: " + error);
  }
}; 