import {login} from "../../utils/utils";
import {mtc_version} from "../views/cluster.view";

describe("mtc_190_check_version", () => {

    it("Login", () => {
        login();
    });

    it("Check MTC versions exist and are the same", () => {
        cy.wait(5000);
        cy.get(mtc_version, {timeout: 10000}).then(versions => {
            expect(versions.first().text()).match(new RegExp('[0-9]+\.[0-9]+\.[0-9]+'))
            expect(versions.first().text()).eq(versions.last().text())
        })
    });
});
