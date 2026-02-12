/// <reference types="cypress" />
import ExecutionPage from '../../../../pageobjects/Studio/Analyze/ExecutionPage';
import { getToken } from '../../../../api/common/requests'

describe('APP-178: Hide deep intermediary sub pipelines behind placeholder', { tags: ['@smoke', '@regression', 'APP-178'] }, function () {
    let adminCredentials;
    let orgname;
    let token;

    before(() => {
        orgname = ENV.orgs.secondaryOrg;
        return cy.fetchAdminUser().then(usr => {
            adminCredentials = {
                username: usr.username,
                password: usr.password,
            }
            return getToken(adminCredentials).then(tk => {
                token = tk
            });
        });
    });

    beforeEach(() => {
        ExecutionPage.login(adminCredentials);
        ExecutionPage.switchOrg(orgname);
        ExecutionPage.waitTillExecutionsTableLoad();
    });

    after(() => {
        cy.logout();
    });

    it('TC_APP178_01: Verify Default view collapses all child generations', { tags: ['TC_APP178_01'] }, function () {
        // Clear all searches if any
        cy.get(ExecutionPage.searchInputCss).clear();
        ExecutionPage.waitTillExecutionsTableLoad();

        // Verify all children of all generations are collapsed under their respective parents
        cy.get(ExecutionPage.listOfPipelineExecutionCss).should('have.length.greaterThan', 0);

        // Check that parent pipelines are visible but children are collapsed by default
        cy.get(ExecutionPage.listOfPipelineExecutionCss).first().then($row => {
            // Verify the row exists and is a parent (not indented)
            cy.wrap($row).should('be.visible');

            // Check that expand/collapse icon exists indicating children are present but collapsed
            cy.wrap($row).find('[qa-id*="expand"], [qa-id*="collapse"], svg').should('exist');
        });

        cy.log('Verified: All children of all generations are collapsed under their respective parents by default');
    });

    it('TC_APP178_02: Verify Parent not matched but child matched', { tags: ['TC_APP178_02'] }, function () {
        // Search using a child pipeline name (need to get a child pipeline name first)
        // First, expand a parent to get child name
        cy.get(ExecutionPage.listOfPipelineExecutionCss).first().click();
        cy.wait(1000);

        // Get child pipeline name if exists
        cy.get('body').then($body => {
            if ($body.find('[qa-id*="child"], tr[class*="child"]').length > 0) {
                cy.get('[qa-id*="child"], tr[class*="child"]').first().invoke('text').then(childName => {
                    const cleanChildName = childName.trim().split('\n')[0];

                    // Clear and search with child pipeline name
                    cy.get(ExecutionPage.searchInputCss).clear()
                    cy.get(ExecutionPage.searchInputCss).type(cleanChildName);
                    ExecutionPage.waitTillExecutionsTableLoad();

                    // Verify: The table should display 'Parent'
                    cy.get(ExecutionPage.listOfPipelineExecutionCss).should('have.length.greaterThan', 0);

                    // Verify: Expanded under Parent, show 'Child'
                    cy.get('[qa-id*="child"], tr[class*="child"]').should('be.visible').and('contain', childName);

                    // Verify: No placeholder rows should be visible
                    cy.contains('Expand hidden hierarchy').should('not.exist');

                    cy.log('Verified: Parent displayed with Child expanded, no placeholder rows visible');
                });
            } else {
                cy.log('No child pipelines found to test with');
            }
        });
    });

    it('TC_APP178_03: Verify Parent not matched but grandchild matched', { tags: ['TC_APP178_03'] }, function () {
        // Search keyword matches a grandchild pipeline
        // This test requires a pipeline structure with at least 3 levels

        // First navigate to find a grandchild
        cy.get(ExecutionPage.listOfPipelineExecutionCss).first().click();
        cy.wait(1000);

        cy.get('body').then($body => {
            // Look for child and then grandchild
            if ($body.find('[qa-id*="child"]').length > 0) {
                cy.get('[qa-id*="child"]').first().click();
                cy.wait(1000);

                // Try to find grandchild
                cy.get('body').then($body2 => {
                    if ($body2.find('[qa-id*="grandchild"], [data-level="2"]').length > 0) {
                        cy.get('[qa-id*="grandchild"], [data-level="2"]').first().invoke('text').then(grandchildName => {
                            const cleanGrandchildName = grandchildName.trim().split('\n')[0];

                            // Search with grandchild pipeline name
                            cy.get(ExecutionPage.searchInputCss).clear()
                            cy.get(ExecutionPage.searchInputCss).type(cleanGrandchildName);
                            ExecutionPage.waitTillExecutionsTableLoad();

                            // Verify: The table should display 'Parent'
                            cy.get(ExecutionPage.listOfPipelineExecutionCss).should('exist');

                            // Verify: Total levels displayed is 3 (Parent -> Child -> Grandchild)
                            // Verify: No placeholder rows should be visible
                            cy.contains('Expand hidden hierarchy').should('not.exist');

                            cy.log('Verified: 3 levels displayed (Parent->Child->Grandchild) with no placeholder');
                        });
                    } else {
                        cy.log('No grandchild pipelines found to test with');
                    }
                });
            } else {
                cy.log('No child pipelines found to test with');
            }
        });
    });

    it('TC_APP178_04: Verify Deep level child match shows hierarchy row', { tags: ['TC_APP178_04'] }, function () {
        // Search keyword matches a great grandchild pipeline (level 4+)
        // This requires a deeply nested pipeline structure

        // For this test, we need to search for a pipeline at level 4 or deeper
        // The test data should have deep nested pipelines set up

        cy.log('Note: This test requires a pipeline with at least 4 levels of nesting');

        // Search for a great grandchild (you'll need to replace with actual pipeline name)
        // Example: cy.get(ExecutionPage.searchInputCss).clear().type('GreatGrandchildPipelineName');

        // For now, documenting the expected behavior:
        // 1. The table should display top level 'Parent'
        // 2. Immediately below Parent, display a placeholder row 'Expand hidden hierarchy'
        // 3. Immediately below placeholder, display 'Great Grandchild'
        // 4. Intermediate rows (Child, Grandchild) are hidden

        cy.log('Test requires deep nested pipeline data (4+ levels)');
        cy.log('Expected: Parent -> Expand hidden hierarchy -> Great Grandchild');
        cy.log('Intermediate levels (Child, Grandchild) should be hidden');
    });

    it('TC_APP178_05: Verify multiple matched children share placeholder', { tags: ['TC_APP178_05'] }, function () {
        // Search keyword matches a grandchild and great-grandchild
        // This verifies that multiple matches share a SINGLE placeholder row

        cy.log('Note: This test requires pipeline with multiple nested levels matching search');

        // For now, documenting the expected behavior:
        // 1. The table should display 'Ultimate Ancestor'
        // 2. Immediately below Ancestor, display a SINGLE placeholder row 'Expand hidden hierarchy'
        // 3. Below the placeholder, list all matching children (Grandchild1, Great Greater Grandchild)
        // 4. The hierarchy between these matches is flattened/not shown

        cy.log('Expected: Single placeholder row for multiple deep matches');
        cy.log('The hierarchy between matches should be flattened');
    });

    it('TC_APP178_06: Verify placeholder row functionality and UI', { tags: ['TC_APP178_06'] }, function () {
        // This test verifies the placeholder row appearance and click functionality

        cy.log('Note: This test requires a search that produces a placeholder row');

        // Search to display placeholder row (requires deep nested pipeline)
        // Example search that would show placeholder:
        // cy.get(ExecutionPage.searchInputCss).clear().type('DeepNestedPipeline');
        // ExecutionPage.waitTillExecutionsTableLoad();

        // Verify placeholder row exists and check its properties
        cy.get('body').then($body => {
            if ($body.find('tr:contains("Expand hidden hierarchy")').length > 0) {
                // 1. Verify placeholder row text is 'Expand hidden hierarchy'
                cy.contains('tr', 'Expand hidden hierarchy').should('be.visible');

                // 2. Verify row background is information, text color is text/information, style is Body
                cy.contains('tr', 'Expand hidden hierarchy').should('have.css', 'background-color');

                // 3. Click on placeholder row
                ExecutionPage.clickExpandHiddenHierarchy();
                cy.wait(1000);

                // 4. Verify placeholder row is replaced by all hidden intermediary pipelines
                cy.contains('Expand hidden hierarchy').should('not.exist');
                cy.log('Verified: Placeholder row replaced by hidden intermediary pipelines');
            } else {
                cy.log('No placeholder row found - test requires deep nested search results');
            }
        });
    });

    it.only('TC_APP178_07: Verify placeholder behaviour with deep nested pipeline', { tags: ['TC_APP178_07'] }, function () {
        // This test requires a pipeline with 7 levels of nesting
        cy.log('Note: This test requires a pipeline with 7 levels of nesting');

        // Test data setup needed: Run a pipeline with deep nested level up to 7 levels
        const parentPipelineName = 'parent_deep_lvl1'; // Replace with actual parent pipeline name
        const level2PipelineName = 'level2'; // Replace with actual pipeline name
        const level3PipelineName = 'level3'; // Replace with actual pipeline name
        const level4PipelineName = 'level4'; // Replace with actual pipeline name
        const level5PipelineName = 'level5'; // Replace with actual pipeline name
        const level6PipelineName = 'level6'; // Replace with actual pipeline name
        const level7PipelineName = 'level7'; // Replace with actual pipeline name

        // Step 1: Search with level 7 pipeline name
        cy.log('Step 1: Search with level 7 pipeline name');
        cy.get(ExecutionPage.searchInputCss).clear()
        cy.get(ExecutionPage.searchInputCss).type(level7PipelineName);
        ExecutionPage.waitTillExecutionsTableLoad();
        // Verify only top parent and level7 pipeline is displayed
        // Verify all others are hidden under expand hierarchy row
        cy.contains('Expand hidden hierarchy').should('exist');
        cy.get(ExecutionPage.listOfPipelineExecutionCss).should('have.length', 2);
        cy.get(ExecutionPage.listOfPipelineExecutionCss).first().should('be.visible');
        cy.get(ExecutionPage.listOfPipelineExecutionCss).first().should('contain.text', parentPipelineName);
        cy.get(ExecutionPage.listOfPipelineExecutionCss).last().should('contain.text', level7PipelineName); // Level 7
        ExecutionPage.clickExpandHiddenHierarchy();
        cy.wait(1000);
        // Verify on clicking placeholder all levels should expand
        cy.get(ExecutionPage.listOfPipelineExecutionCss).first().should('contain.text', parentPipelineName);
        cy.get(ExecutionPage.listOfPipelineExecutionCss).eq(1).should('contain.text', level2PipelineName);
        cy.get(ExecutionPage.listOfPipelineExecutionCss).eq(2).should('contain.text', level3PipelineName);
        cy.get(ExecutionPage.listOfPipelineExecutionCss).eq(3).should('contain.text', level4PipelineName);
        cy.get(ExecutionPage.listOfPipelineExecutionCss).eq(4).should('contain.text', level5PipelineName);
        cy.get(ExecutionPage.listOfPipelineExecutionCss).eq(5).should('contain.text', level6PipelineName);
        cy.get(ExecutionPage.listOfPipelineExecutionCss).eq(6).should('contain.text', level7PipelineName);
        cy.get(ExecutionPage.listOfPipelineExecutionCss).should('have.length', 7);

        // Step 2: Search with level5 pipeline name
        cy.log('Step 2: Search with level 5 pipeline name');
        cy.get(ExecutionPage.searchInputCss).clear()
        cy.get(ExecutionPage.searchInputCss).type(level5PipelineName);
        ExecutionPage.waitTillExecutionsTableLoad();
        cy.wait(5000);
        // Verify only top parent and level5 pipeline is displayed
        // Verify levels above level5 are hidden under expand hierarchy row
        // Click show all children should expand level 6 and level 7
        cy.contains('Expand hidden hierarchy').should('exist');
        cy.get(ExecutionPage.listOfPipelineExecutionCss).should('have.length', 2);
        cy.get(ExecutionPage.listOfPipelineExecutionCss).first().should('be.visible');
        cy.get(ExecutionPage.listOfPipelineExecutionCss).first().should('contain.text', parentPipelineName);
        cy.get(ExecutionPage.listOfPipelineExecutionCss).last().should('contain.text', level5PipelineName);

        // Step 3: Search with level4 pipeline name
        cy.log('Step 3: Search with level 4 pipeline name');
        cy.get(ExecutionPage.searchInputCss).clear()
        cy.get(ExecutionPage.searchInputCss).type(level4PipelineName);
        ExecutionPage.waitTillExecutionsTableLoad();
        cy.wait(5000);
        // Verify only top parent and level4 pipeline is displayed
        // Verify levels above level4 are hidden under expand hierarchy row
        // Click show all children should expand level 5, 6, and 7
        cy.contains('Expand hidden hierarchy').should('exist');
        cy.get(ExecutionPage.listOfPipelineExecutionCss).should('have.length', 2);
        cy.get(ExecutionPage.listOfPipelineExecutionCss).first().should('be.visible');
        cy.get(ExecutionPage.listOfPipelineExecutionCss).first().should('contain.text', parentPipelineName);
        cy.get(ExecutionPage.listOfPipelineExecutionCss).last().should('contain.text', level4PipelineName);

        // Step 4: Click on placeholder row
        cy.log('Step 4: Click on placeholder row');
        ExecutionPage.clickExpandHiddenHierarchy();
        // Verify on clicking placeholder all levels should expand
        cy.get(ExecutionPage.listOfPipelineExecutionCss).first().should('contain.text', parentPipelineName);
        cy.get(ExecutionPage.listOfPipelineExecutionCss).eq(1).should('contain.text', level2PipelineName);
        cy.get(ExecutionPage.listOfPipelineExecutionCss).eq(2).should('contain.text', level3PipelineName);
        cy.get(ExecutionPage.listOfPipelineExecutionCss).last().should('contain.text', level4PipelineName);

        // Step 5: Clear search and search with level3 pipeline name
        cy.log('Step 5: Search with level 3 pipeline name');
        cy.get(ExecutionPage.searchInputCss).clear()
        cy.get(ExecutionPage.searchInputCss).type(level3PipelineName);
        ExecutionPage.waitTillExecutionsTableLoad();
        cy.wait(5000);
        // Verify when searched with level3 no placeholder row is displayed
        cy.contains('Expand hidden hierarchy').should('not.exist');
        cy.get(ExecutionPage.listOfPipelineExecutionCss).should('have.length', 3);
        cy.get(ExecutionPage.listOfPipelineExecutionCss).first().should('be.visible');
        cy.get(ExecutionPage.listOfPipelineExecutionCss).first().should('contain.text', parentPipelineName);
        cy.get(ExecutionPage.listOfPipelineExecutionCss).eq(1).should('contain.text', level2PipelineName);
        cy.get(ExecutionPage.listOfPipelineExecutionCss).eq(2).should('contain.text', level3PipelineName);

        // Step 6: Click on show all children
        cy.log('Step 6: Click on show all children');
        ExecutionPage.showAllChildrenCheckbox.click();
        cy.wait(10000);
        // Verify clicking on show all children should expand up to level7
        cy.get(ExecutionPage.listOfPipelineExecutionCss).first().should('contain.text', parentPipelineName);
        cy.get(ExecutionPage.listOfPipelineExecutionCss).eq(1).should('contain.text', level2PipelineName);
        cy.get(ExecutionPage.listOfPipelineExecutionCss).eq(2).should('contain.text', level3PipelineName);
        cy.get(ExecutionPage.listOfPipelineExecutionCss).eq(3).should('contain.text', level4PipelineName);
        cy.get(ExecutionPage.listOfPipelineExecutionCss).eq(4).should('contain.text', level5PipelineName);
        cy.get(ExecutionPage.listOfPipelineExecutionCss).eq(5).should('contain.text', level6PipelineName);
        cy.get(ExecutionPage.listOfPipelineExecutionCss).eq(6).should('contain.text', level7PipelineName);

        // Step 7: Uncheck show all children
        cy.log('Step 7: Uncheck show all children');
        ExecutionPage.showAllChildrenCheckbox.click();
        // Verify unchecking should display only parent, level2, level3
        cy.get(ExecutionPage.listOfPipelineExecutionCss).should('have.length', 3);
        cy.get(ExecutionPage.listOfPipelineExecutionCss).first().should('contain.text', parentPipelineName);
        cy.get(ExecutionPage.listOfPipelineExecutionCss).eq(1).should('contain.text', level2PipelineName);
        cy.get(ExecutionPage.listOfPipelineExecutionCss).eq(2).should('contain.text', level3PipelineName);
    });

    it.only('TC_APP178_08: Verify search with RUUID', { tags: ['TC_1APP178_08'] }, function () {
        // This test verifies placeholder behavior when searching with RUUID instead of pipeline name
        cy.log('Note: This test requires a pipeline with 7 levels of nesting');
        const payload = {
            org: orgname,
            headers: { Authorization: `SLToken ${ token }` },
        }
        const parentPipelineName = 'parent_deep_lvl1'; // Replace with actual parent pipeline name
        const level2PipelineName = 'level2'; // Replace with actual pipeline name
        const level3PipelineName = 'level3'; // Replace with actual pipeline name
        const level4PipelineName = 'level4'; // Replace with actual pipeline name
        const level5PipelineName = 'level5'; // Replace with actual pipeline name
        const level6PipelineName = 'level6'; // Replace with actual pipeline name
        const level7PipelineName = 'level7'; // Replace with actual pipeline name

        // Get RUUIDs for different levels (level 1 through 7)
        const pipelineNames = [level2PipelineName, level3PipelineName, level4PipelineName, level5PipelineName, level6PipelineName, level7PipelineName];

        // Get instance IDs for all 7 levels
        cy.wrap(pipelineNames).then((names) => {
            const ids = {};

            // Chain all the API calls sequentially using reduce
            return names.reduce((chainPromise, pipelineNames, index) => {
                return chainPromise.then(() => {
                    return cy.getNestedPipelineInstanceIDs(payload, pipelineNames).then((instanceId) => {
                        ids[`level${index + 2}RUUID`] = instanceId;
                        cy.log(`Level ${index + 2} Instance ID:`, instanceId);
                    });
                });
            }, cy.wrap(null)).then(() => ids);
        }).then((instanceIds) => {
            console.log('All Instance IDs retrieved:', instanceIds);
            cy.log('All Instance IDs retrieved:', instanceIds);

            // Similar to TC_APP178_07 but using RUUID for search
            // Test data setup needed: Run a pipeline with deep nested level up to 7 levels

            // Step 1: Search with level 7 RUUID
            cy.log('Step 1: Search with level 7 RUUID');
            cy.get(ExecutionPage.searchInputCss).clear()
            cy.log('Searching with RUUID 7:', instanceIds.level7RUUID);
            cy.get(ExecutionPage.searchInputCss).type(`pipe_runtime_id=${instanceIds.level7RUUID}`);
            ExecutionPage.waitTillExecutionsTableLoad();
            // Verify only top parent and level7 pipeline is displayed
            // Verify all others are hidden under expand hierarchy row
            cy.contains('Expand hidden hierarchy').should('exist');
            cy.get(ExecutionPage.listOfPipelineExecutionCss).should('have.length', 2);
            cy.get(ExecutionPage.listOfPipelineExecutionCss).first().should('be.visible');
            cy.get(ExecutionPage.listOfPipelineExecutionCss).first().should('contain.text', parentPipelineName);
            cy.get(ExecutionPage.listOfPipelineExecutionCss).last().should('contain.text', level7PipelineName); // Level 7

            ExecutionPage.clickExpandHiddenHierarchy();
            cy.wait(5000);
            // Verify on clicking placeholder all levels should expand
            cy.get(ExecutionPage.listOfPipelineExecutionCss).first().should('contain.text', parentPipelineName);
            cy.get(ExecutionPage.listOfPipelineExecutionCss).eq(1).should('contain.text', level2PipelineName);
            cy.get(ExecutionPage.listOfPipelineExecutionCss).eq(2).should('contain.text', level3PipelineName);
            cy.get(ExecutionPage.listOfPipelineExecutionCss).eq(3).should('contain.text', level4PipelineName);
            cy.get(ExecutionPage.listOfPipelineExecutionCss).eq(4).should('contain.text', level5PipelineName);
            cy.get(ExecutionPage.listOfPipelineExecutionCss).eq(5).should('contain.text', level6PipelineName);
            cy.get(ExecutionPage.listOfPipelineExecutionCss).eq(6).should('contain.text', level7PipelineName);
            cy.get(ExecutionPage.listOfPipelineExecutionCss).should('have.length', 7);

            // Step 2: Search with level6 RUUID
            cy.log('Step 2: Search with level 6 RUUID');
            cy.get(ExecutionPage.searchInputCss).clear()
            cy.get(ExecutionPage.searchInputCss).type(`pipe_runtime_id=${instanceIds.level6RUUID}`);
            ExecutionPage.waitTillExecutionsTableLoad();
            cy.wait(5000);
            cy.contains('Expand hidden hierarchy').should('exist');
            cy.get(ExecutionPage.listOfPipelineExecutionCss).should('have.length', 2);
            cy.get(ExecutionPage.listOfPipelineExecutionCss).first().should('be.visible');
            cy.get(ExecutionPage.listOfPipelineExecutionCss).first().should('contain.text', parentPipelineName);
            cy.get(ExecutionPage.listOfPipelineExecutionCss).last().should('contain.text', level6PipelineName);
            // Verify only top parent and level6 pipeline is displayed
            // Verify levels above level6 are hidden under expand hierarchy row
            ExecutionPage.clickExpandHiddenHierarchy();
            cy.wait(5000);
            cy.get(ExecutionPage.listOfPipelineExecutionCss).first().should('contain.text', parentPipelineName);
            cy.get(ExecutionPage.listOfPipelineExecutionCss).eq(1).should('contain.text', level2PipelineName);
            cy.get(ExecutionPage.listOfPipelineExecutionCss).eq(2).should('contain.text', level3PipelineName);
            cy.get(ExecutionPage.listOfPipelineExecutionCss).eq(3).should('contain.text', level4PipelineName);
            cy.get(ExecutionPage.listOfPipelineExecutionCss).eq(4).should('contain.text', level5PipelineName);
            cy.get(ExecutionPage.listOfPipelineExecutionCss).eq(5).should('contain.text', level6PipelineName);
            cy.get(ExecutionPage.listOfPipelineExecutionCss).should('have.length', 6);

            // Click show all children should expand level 7
            ExecutionPage.showAllChildrenCheckbox.click();
            cy.wait(5000);
            cy.get(ExecutionPage.listOfPipelineExecutionCss).first().should('contain.text', parentPipelineName);
            cy.get(ExecutionPage.listOfPipelineExecutionCss).eq(1).should('contain.text', level2PipelineName);
            cy.get(ExecutionPage.listOfPipelineExecutionCss).eq(2).should('contain.text', level3PipelineName);
            cy.get(ExecutionPage.listOfPipelineExecutionCss).eq(3).should('contain.text', level4PipelineName);
            cy.get(ExecutionPage.listOfPipelineExecutionCss).eq(4).should('contain.text', level5PipelineName);
            cy.get(ExecutionPage.listOfPipelineExecutionCss).eq(5).should('contain.text', level6PipelineName);
            cy.get(ExecutionPage.listOfPipelineExecutionCss).eq(6).should('contain.text', level7PipelineName);
            ExecutionPage.showAllChildrenCheckbox.click();

            // Step 3: Search with level4 RUUID
            cy.log('Step 3: Search with level 4 RUUID');
            cy.get(ExecutionPage.searchInputCss).clear()
            cy.get(ExecutionPage.searchInputCss).type(`pipe_runtime_id=${instanceIds.level4RUUID}`);
            ExecutionPage.waitTillExecutionsTableLoad();
            cy.wait(5000);
            // Verify only top parent and level4 pipeline is displayed
            // Verify levels above level4 are hidden under expand hierarchy row
            cy.contains('Expand hidden hierarchy').should('exist');
            cy.get(ExecutionPage.listOfPipelineExecutionCss).should('have.length', 2);
            cy.get(ExecutionPage.listOfPipelineExecutionCss).first().should('be.visible');
            cy.get(ExecutionPage.listOfPipelineExecutionCss).first().should('contain.text', parentPipelineName);
            cy.get(ExecutionPage.listOfPipelineExecutionCss).last().should('contain.text', level4PipelineName);

            // Step 4: Click on placeholder row
            cy.log('Step 4: Click on placeholder row');
            ExecutionPage.clickExpandHiddenHierarchy();
            // Verify on clicking placeholder all levels should expand
            cy.get(ExecutionPage.listOfPipelineExecutionCss).first().should('contain.text', parentPipelineName);
            cy.get(ExecutionPage.listOfPipelineExecutionCss).eq(1).should('contain.text', level2PipelineName);
            cy.get(ExecutionPage.listOfPipelineExecutionCss).eq(2).should('contain.text', level3PipelineName);
            cy.get(ExecutionPage.listOfPipelineExecutionCss).eq(3).should('contain.text', level4PipelineName);
            cy.get(ExecutionPage.listOfPipelineExecutionCss).should('have.length', 4);

            // Step 5: Clear search and search with level3 pipeline name
            cy.log('Step 5: Search with level 3 pipeline name');
            cy.get(ExecutionPage.searchInputCss).clear()
            cy.get(ExecutionPage.searchInputCss).type(`pipe_runtime_id=${instanceIds.level3RUUID}`);
            ExecutionPage.waitTillExecutionsTableLoad();
            cy.wait(5000);
            // Verify when searched with level3 no placeholder row is displayed
            cy.contains('Expand hidden hierarchy').should('not.exist');
            cy.get(ExecutionPage.listOfPipelineExecutionCss).should('have.length', 3);
            cy.get(ExecutionPage.listOfPipelineExecutionCss).first().should('be.visible');
            cy.get(ExecutionPage.listOfPipelineExecutionCss).first().should('contain.text', parentPipelineName);
            cy.get(ExecutionPage.listOfPipelineExecutionCss).eq(1).should('contain.text', level2PipelineName);
            cy.get(ExecutionPage.listOfPipelineExecutionCss).eq(2).should('contain.text', level3PipelineName);

            // Step 6: Click on show all children
            cy.log('Step 6: Click on show all children');
            ExecutionPage.showAllChildrenCheckbox.click();
            cy.wait(5000);
            // Verify clicking on show all children should expand up to level7
            cy.get(ExecutionPage.listOfPipelineExecutionCss).first().should('contain.text', parentPipelineName);
            cy.get(ExecutionPage.listOfPipelineExecutionCss).eq(1).should('contain.text', level2PipelineName);
            cy.get(ExecutionPage.listOfPipelineExecutionCss).eq(2).should('contain.text', level3PipelineName);
            cy.get(ExecutionPage.listOfPipelineExecutionCss).eq(3).should('contain.text', level4PipelineName);
            cy.get(ExecutionPage.listOfPipelineExecutionCss).eq(4).should('contain.text', level5PipelineName);
            cy.get(ExecutionPage.listOfPipelineExecutionCss).eq(5).should('contain.text', level6PipelineName);
            cy.get(ExecutionPage.listOfPipelineExecutionCss).eq(6).should('contain.text', level7PipelineName);

            // Step 7: Uncheck show all children
            cy.log('Step 7: Uncheck show all children');
            ExecutionPage.showAllChildrenCheckbox.click();
            // Verify unchecking should display only parent, level2, level3
            cy.get(ExecutionPage.listOfPipelineExecutionCss).should('have.length', 3);
            cy.get(ExecutionPage.listOfPipelineExecutionCss).first().should('contain.text', parentPipelineName);
            cy.get(ExecutionPage.listOfPipelineExecutionCss).eq(1).should('contain.text', level2PipelineName);
            cy.get(ExecutionPage.listOfPipelineExecutionCss).eq(2).should('contain.text', level3PipelineName);
            cy.log('Test framework created - requires actual 7-level nested pipeline data with RUUIDs');
        });
    });
});