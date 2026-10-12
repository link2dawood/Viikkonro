import { describe,expect,it } from "vitest";
import { publicErrorEvent } from "./errorReporting.js";
describe("public Sentry reports",() => {
  it("keeps safe stack locations without company/user data or URL credentials",() => {
    const result=publicErrorEvent({ event_id:"test",environment:"production",exception:{values:[{
      type:"TypeError",value:"Company Ääkkönen buyer@example.com",stacktrace:{frames:[{
        filename:"https://viikkonro.fi/assets/app-123.js?company=PRIVATE#TOKEN",lineno:5,colno:6,in_app:true,vars:{company:"PRIVATE"},function:"PRIVATE",
      },{filename:"data:image/svg+xml,PRIVATE",lineno:1}]},
    }]},request:{data:"PRIVATE"},extra:{company:"PRIVATE"},contexts:{},user:{email:"buyer@example.com"},breadcrumbs:[{message:"PRIVATE"}] });
    expect(result.exception.values[0].type).toBe("TypeError");
    expect(result.exception.values[0].stacktrace.frames[0]).toEqual({filename:"https://viikkonro.fi/assets/app-123.js",lineno:5,colno:6,in_app:true});
    expect(JSON.stringify(result)).not.toMatch(/PRIVATE|TOKEN|buyer@example.com|Ääkkönen/);
    for(const key of ["request","user","breadcrumbs","extra","contexts"])expect(result).not.toHaveProperty(key);
  });
  it("drops messages without stack errors and normalizes custom exception names",() => {
    expect(publicErrorEvent({message:"PRIVATE"})).toBeNull();
    expect(publicErrorEvent({exception:{values:[{type:"PRIVATE",value:"PRIVATE"}]}}).exception.values[0].type).toBe("Error");
  });
});
