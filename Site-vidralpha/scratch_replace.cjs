const fs = require('fs');
const filePath = 'c:\\Users\\Desktop\\Documents\\Vidralpha\\Site-vidralpha\\src\\pages\\AdminItemCosts.jsx';

let content = fs.readFileSync(filePath, 'utf8');

// Replace items tab
content = content.replace(
    /\{activeTab === 'items' && \([\s\S]*?\}\)\s*\n\s*\}/, 
    `{activeTab === 'items' && (
                <AdminCostsItemsTab
                    loading={itemLoading}
                    lines={lines}
                    removeLine={removeLine}
                    setActiveLineModal={setActiveLineModal}
                />
            )}`
);

// Replace glass tab
// We need to be careful with the glass tab since it has nested parens.
// The glass tab ends just before TAB: PERFIS DE ALUMÍNIO
const glassTabStart = content.indexOf("{activeTab === 'glass' && (");
const glassTabEndString = "TAB: PERFIS DE ALUMÍNIO";
const nextCommentStart = content.indexOf("{/* ══════════════════════════════════════════════════════════════════════", glassTabStart);

if (glassTabStart !== -1 && nextCommentStart !== -1) {
    const before = content.substring(0, glassTabStart);
    const after = content.substring(nextCommentStart);
    content = before + `{activeTab === 'glass' && (
                <AdminCostsGlassTab
                    loading={glassLoading}
                    colors={colors}
                    setShowGlobalColorsModal={setShowGlobalColorsModal}
                    glassTypesList={glassTypesList}
                    setActiveGlassModal={setActiveGlassModal}
                />
            )}\n\n            ` + after;
}

// Replace aluminum tab
// Aluminum tab ends just before "{/* Batch Save Footer */}" or the end of the return statement.
// Since it's the last tab, let's find the start.
const alumTabStart = content.indexOf("{activeTab === 'aluminum' && (");
// The end is before the final </div></div></div>
if (alumTabStart !== -1) {
    // Find the end of the activeTab === 'aluminum' block by counting curly braces or by looking for the end of the container div
    // We can just use a regex since it's the last expression
    const beforeAlum = content.substring(0, alumTabStart);
    const afterAlumIndex = content.lastIndexOf("</div>\n        </div>\n    )\n}");
    
    if (afterAlumIndex !== -1) {
        const afterAlum = content.substring(afterAlumIndex);
        content = beforeAlum + `{activeTab === 'aluminum' && (
                <AdminCostsAluminumTab
                    loading={alumLoading}
                    alumColors={alumColors}
                    setShowAlumColorsModal={setShowAlumColorsModal}
                    lines={lines}
                    structure={structure}
                    activeAlumColorsByKey={activeAlumColorsByKey}
                    setActiveAlumLine={setActiveAlumLine}
                />
            )}\n        ` + afterAlum;
    }
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Done replacement.');
