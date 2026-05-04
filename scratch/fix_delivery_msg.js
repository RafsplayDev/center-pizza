// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require('fs');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require('path');

const filePath = 'c:\\Users\\Rafael\\Desktop\\Center pizza\\center-pizza\\src\\app\\(client)\\page.tsx';
let content = fs.readFileSync(filePath, 'utf8');

const startMarker = "AlertCircle size={16} className=\"text-rose-500 flex-none\" />";
const endMarker = "userData.endereco && (";

const sIdx = content.indexOf(startMarker);
const eIdx = content.indexOf(endMarker);

if (sIdx !== -1 && eIdx !== -1) {
    const before = content.substring(0, content.indexOf("</span>", sIdx) + 15); // End of the rose section
    const after = content.substring(eIdx);
    
    const mid = `
                          </div>
                        ) : userData.deliveryFee > 0 ? (
                          <div className="w-full p-4 bg-emerald-50 border-2 border-emerald-200 rounded-2xl flex gap-3 items-center animate-in zoom-in-95 duration-300">
                            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-none">
                              <CheckIcon size={20} className="text-emerald-600" />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[14px] font-black text-emerald-800 leading-none">Entregamos nesse endereço!</span>
                              <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider mt-1.5 opacity-70">
                                Taxa de entrega: R$ {formatPrice(userData.deliveryFee)}
                              </span>
                            </div>
                          </div>
                        ) : `;
    
    fs.writeFileSync(filePath, before + mid + after);
    console.log('File patched successfully');
} else {
    console.error('Markers not found');
}
