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
        let attachment = XCTAttachment(screenshot: app.screenshot())
        attachment.name = "LargeText-Portrait"
        attachment.lifetime = .keepAlways
        add(attachment)
        XCUIDevice.shared.orientation = .landscapeLeft
        XCTAssertTrue(app.tabBars.buttons["Aktien"].isHittable)
        app.tabBars.buttons["Aktien"].tap()
        XCTAssertTrue(app.navigationBars["Aktien"].exists)
        add(XCTAttachment(screenshot: app.screenshot()))
        XCUIDevice.shared.orientation = .portrait
        app.terminate()
        app.launchEnvironment["MOREMONEY_RESET_TEST_DATA"] = "0"
        app.launch()
        app.tabBars.buttons["Finanzen"].tap()
        XCTAssertTrue(app.staticTexts[title].waitForExistence(timeout: 5))
    }
}
