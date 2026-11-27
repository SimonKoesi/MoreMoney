import XCTest

final class LayoutTests: XCTestCase {
    func testLargeTextAndPersistentLongNames() throws {
        let app = XCUIApplication()
        app.launchEnvironment["MOREMONEY_UI_TEST_STORE"] = "1"
        app.launchEnvironment["MOREMONEY_RESET_TEST_DATA"] = "1"
        app.launchArguments += ["-UIPreferredContentSizeCategoryName", "UICTContentSizeCategoryAccessibilityXXXL"]
        app.launch()
        XCTAssertFalse(app.buttons["Demo laden"].exists)
        app.tabBars.buttons["Finanzen"].tap()
        app.buttons["add-record"].tap()
        let name = app.textFields["record-name"].exists ? app.textFields["record-name"] : app.textViews["record-name"]
        XCTAssertTrue(name.waitForExistence(timeout: 5))
        name.tap()
        let title = "Mein persönliches Konto für langfristige Lebensplanung"
        name.typeText(title)
        let amount = app.textFields["record-amount"]
        amount.tap(); amount.typeText("1234,56")
        app.buttons["save-record"].tap()
        XCTAssertTrue(app.staticTexts[title].waitForExistence(timeout: 5))
        Thread.sleep(forTimeInterval: 1) // Wait for the native navigation transition before visual capture.
        let attachment = XCTAttachment(screenshot: XCUIScreen.main.screenshot())
        attachment.name = "LargeText-Portrait"
        attachment.lifetime = .keepAlways
        add(attachment)
        XCUIDevice.shared.orientation = .landscapeLeft
        XCTAssertFalse(app.tabBars.buttons["Aktien"].exists)
        app.tabBars.buttons["Finanzen"].tap()
        let landscapeFrame = XCTNSPredicateExpectation(predicate: NSPredicate { _, _ in app.frame.width > app.frame.height }, object: nil)
        XCTAssertEqual(XCTWaiter.wait(for: [landscapeFrame], timeout: 5), .completed)
        Thread.sleep(forTimeInterval: 1)
        let landscape = XCTAttachment(screenshot: XCUIScreen.main.screenshot())
        landscape.name = "LargeText-Landscape"
        landscape.lifetime = .keepAlways
        add(landscape)
        XCUIDevice.shared.orientation = .portrait
        app.terminate()
        app.launchEnvironment["MOREMONEY_RESET_TEST_DATA"] = "0"
        app.launch()
        app.tabBars.buttons["Finanzen"].tap()
        XCTAssertTrue(app.staticTexts[title].waitForExistence(timeout: 5))
    }

    func testLongBudgetForm() throws {
        let app = XCUIApplication()
        app.launchEnvironment["MOREMONEY_UI_TEST_STORE"] = "1"
        app.launchEnvironment["MOREMONEY_RESET_TEST_DATA"] = "1"
        app.launchArguments += ["-UIPreferredContentSizeCategoryName", "UICTContentSizeCategoryAccessibilityXXXL"]
        app.launch()
        app.tabBars.buttons["Pläne"].tap()
        app.buttons["Plan hinzufügen"].tap()
        let name = app.textFields["record-name"].exists ? app.textFields["record-name"] : app.textViews["record-name"]
        name.tap(); name.typeText("Wohnungseinrichtung und langfristige Lebensplanung")
        app.textFields["record-amount"].tap(); app.textFields["record-amount"].typeText("2500")
        app.buttons["save-record"].tap()
        let title = app.staticTexts["Wohnungseinrichtung und langfristige Lebensplanung"]
        XCTAssertTrue(title.waitForExistence(timeout: 5))
        title.tap()
        XCTAssertTrue(app.buttons["Position hinzufügen"].isHittable)
        Thread.sleep(forTimeInterval: 1)
        let budget = XCTAttachment(screenshot: XCUIScreen.main.screenshot())
        budget.name = "LargeText-Budget"
        budget.lifetime = .keepAlways
        add(budget)
    }
    func testInstallmentFormWithLargeText() throws {
        let app = XCUIApplication()
        app.launchEnvironment["MOREMONEY_UI_TEST_STORE"] = "1"
        app.launchEnvironment["MOREMONEY_RESET_TEST_DATA"] = "1"
        app.launchArguments += ["-UIPreferredContentSizeCategoryName", "UICTContentSizeCategoryAccessibilityXXXL"]
        app.launch()
        app.tabBars.buttons["Mehr"].tap()
        app.buttons["Raten & Darlehen"].tap()
        app.buttons["Finanzierung hinzufügen"].tap()
        func fill(_ fields: XCUIElementQuery, _ id: String, _ value: String) throws {
            let field = fields[id]
            for _ in 0..<8 {
                if field.exists && field.isHittable { break }
                let start = app.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.7))
                let end = app.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.45))
                start.press(forDuration: 0.05, thenDragTo: end)
            }
            let visibleField = try XCTUnwrap(field.exists && field.isHittable ? field : nil, "Feld nicht erreichbar: \(id)")
            visibleField.tap()
            visibleField.typeText(value)
            if app.buttons["Fertig"].firstMatch.isHittable { app.buttons["Fertig"].firstMatch.tap() }
        }
        let nameFields = app.descendants(matching: .any).matching(NSPredicate(format: "identifier == %@", "installment-name"))
        let name = nameFields.element(boundBy: 0)
        XCTAssertTrue(name.waitForExistence(timeout: 5))
        let nameQuery = name.elementType == .textView ? app.textViews : app.textFields
        try fill(nameQuery, "installment-name", "Meine langfristige Anschaffung auf Raten")
        try fill(app.textFields, "installment-total", "1000,01")
        try fill(app.textFields, "installment-rate", "300")
        app.buttons["Speichern"].tap()
        let title = app.staticTexts["Meine langfristige Anschaffung auf Raten · Restbetrag"]
        XCTAssertTrue(title.waitForExistence(timeout: 5))
        title.tap()
        for _ in 0..<6 { if app.buttons["Zahlung erfassen"].firstMatch.isHittable { break }; app.swipeUp() }
        XCTAssertTrue(app.buttons["Zahlung erfassen"].firstMatch.isHittable)
        app.buttons["Zahlung erfassen"].firstMatch.tap()
        app.buttons["Buchen"].tap()
        let error = app.alerts["Zahlung nicht gebucht"]
        XCTAssertTrue(error.staticTexts["Bitte ein vorhandenes Konto wählen."].waitForExistence(timeout: 10))
        let validation = XCTAttachment(screenshot: XCUIScreen.main.screenshot())
        validation.name = "LargeText-InstallmentValidation"
        validation.lifetime = .keepAlways
        add(validation)
        error.buttons["OK"].tap()
        app.buttons["Abbrechen"].tap()
        Thread.sleep(forTimeInterval: 1)
        let attachment = XCTAttachment(screenshot: XCUIScreen.main.screenshot())
        attachment.name = "LargeText-Installments"
        attachment.lifetime = .keepAlways; add(attachment)
    }
}
