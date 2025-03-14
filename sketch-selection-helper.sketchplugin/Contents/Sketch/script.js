// Sketch Selection Helper
// A plugin to copy selection IDs for use with Sketch Context MCP

var onRun = function(context) {
  var selection = context.selection;
  var doc = context.document;
  
  if (selection.count() === 0) {
    doc.showMessage("Please select at least one layer");
    return;
  }
  
  var ids = [];
  for (var i = 0; i < selection.count(); i++) {
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
  }
  
  // Format the data for clipboard
  var jsonData = JSON.stringify(ids, null, 2);
  
  // Copy to clipboard
  var pasteBoard = NSPasteboard.generalPasteboard();
  pasteBoard.clearContents();
  pasteBoard.setString_forType_(jsonData, NSPasteboardTypeString);
  
  // Show success message with count
  doc.showMessage(selection.count() + " layer(s) copied to clipboard! Use these IDs with Sketch Context MCP.");
  
  // Log to console for debugging
  log("Selection IDs copied to clipboard:");
  log(jsonData);
}; 