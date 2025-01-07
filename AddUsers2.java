package com.tests.dp;

import com.slqa.annotations.ClassData;
import com.slqa.api.SLRestServices;
import com.slqa.config.ConfigManager;
import com.slqa.datatypes.LoginUserType;
import com.slqa.exceptions.SLRestServiceException;
import com.snaplogic.automation.framework.core.SlInitSettingsFactory;
import com.tests.base.BaseTest;
import org.testng.annotations.BeforeClass;
import org.testng.annotations.Test;

@ClassData(userTypeList = {LoginUserType.BASIC_USER,LoginUserType.ADMIN})
public class AddUsers2 extends BaseTest {

    @BeforeClass
    public void beforeClass() throws Exception {
        SLRestServices restServ = SlInitSettingsFactory.getRestServicesMap().get(LoginUserType.ADMIN);
        orgNameAttr = ConfigManager.getBundle().getString("org.primaryOrg");
        snaplexMap = getSnaplexMap(orgNameAttr, restServ);
        snaplexNameAttr = snaplexMap.get(SnaplexMapKeys.GROUND_FEEDMASTER);

    }
    @Test(alwaysRun = true)
    public void addExistingUserToDifferentOrg() {
        String pod = "https://cdn.canary.elastic.snaplogicdev.com/", orgAdminUserName = "vskamarsu@snaplogic.com", orgAdminPassword = "Shireen@2000";
        SLRestServices restServ = new SLRestServices(pod, orgAdminUserName, orgAdminPassword);//Rest service object of existing admin

        String orgs[] = {"DpAutomation", "DpAutomation2"};
        for (int a = 0; a <orgs.length; a++)
        {

            for (int i = 1; i <= 20; i++) {
                System.out.println("#############################");
                System.out.println("Adding users started for"+orgs[a]);
                String userName = "platformqa+basic" + i + "@snaplogicdev.net";
                try {
                    restServ.addExistingUsersToOrg(userName, orgs[a]);

                } catch (SLRestServiceException e) {

                    System.err.println("Error adding user " + userName + " to organization " + orgs[a] + ": " + e.getMessage());
                    e.printStackTrace();
                }
            }
            //for admin
            for (int i = 1; i <= 240; i++) {
                String userName = "platformqa+admin" + i + "@snaplogicdev.net";
                try {
                    restServ.addExistingUsersToOrg(userName, orgs[a]);
                    System.out.println("Adding admin to group in org : "+orgs[a]);
                    restServ.addUserToGroup(orgs[a], "admins", userName);

                } catch (SLRestServiceException e) {

                    System.err.println("Error adding user " + userName + " to organization " + orgs[a] + ": " + e.getMessage());
                    e.printStackTrace();
                }
            }
            System.out.println("#############################");
            System.out.println("Adding users ended for"+orgs[a]);
        }
    }
    }
