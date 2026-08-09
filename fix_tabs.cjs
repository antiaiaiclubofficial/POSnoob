const fs = require('fs');
const file = 'src/pages/Inventory.tsx';
let content = fs.readFileSync(file, 'utf8');

const masterStart = content.indexOf('{activeTab === \'master\' && (');
const checkStart = content.indexOf('{activeTab === \'check\' && (');
const adjustStart = content.indexOf('{activeTab === \'adjust\' && (');

if (masterStart !== -1 && checkStart !== -1 && adjustStart !== -1) {
  // Extract the grid code from the check tab
  const gridStartString = '<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">';
  const gridStartIndex = content.indexOf(gridStartString, checkStart);
  
  // Find the end of the grid code which is before the check tab ends.
  // The check tab ends right before adjustStart. Let's find the closing div of the grid.
  // We can just use a regex or string extraction if we know it ends with `</div>\n        )}`
  const checkTabEndStr = '        )}\n\n        {activeTab === \'adjust\' && (';
  const checkTabEndIndex = content.indexOf(checkTabEndStr);
  
  if (gridStartIndex !== -1 && checkTabEndIndex !== -1) {
    let gridCode = content.substring(gridStartIndex, checkTabEndIndex).trim();
    // replace filteredCheckItems with filteredInventory
    gridCode = gridCode.replace(/filteredCheckItems/g, 'filteredInventory');
    
    // Now insert this grid code into the master tab where the table is.
    const tableContainerStartStr = '<div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">';
    const tableContainerStartIndex = content.indexOf(tableContainerStartStr, masterStart);
    
    const tableContainerEndStr = '              </div>\n            </div>\n          </div>\n        )}\n\n        {activeTab === \'check\' && (';
    const tableContainerEndIndex = content.indexOf(tableContainerEndStr, tableContainerStartIndex);
    
    // We need to wrap the existing table and the new grid in a ternary condition.
    // Let's replace the whole table section.
    
    let tableCode = content.substring(
      tableContainerStartIndex + tableContainerStartStr.length, 
      content.indexOf('            </div>\n          </div>\n        )}', tableContainerStartIndex)
    ).trim();

    // Now construct the new master tab body
    let newMasterContent = `
            <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden p-4">
              {viewMode === 'list' ? (
                ${tableCode}
              ) : (
                ${gridCode}
              )}
            </div>
          </div>
        )}

        {activeTab === 'adjust' && (`;

    // Replace the block from tableContainerStart to the end of check tab
    let beforeTable = content.substring(0, tableContainerStartIndex);
    let afterCheckTab = content.substring(checkTabEndIndex + checkTabEndStr.length - '        {activeTab === \'adjust\' && ('.length);
    
    content = beforeTable + newMasterContent + afterCheckTab;
    fs.writeFileSync(file, content);
    console.log("Successfully replaced and moved grid code.");
  } else {
    console.log("Could not find grid start or check tab end.");
  }
} else {
  console.log("Could not find master, check, or adjust tabs.");
}
