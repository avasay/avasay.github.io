---
layout: post
title:  "Role-Based Windows Authentication with .NET MVC"
date:   2019-11-06 08:10:00 -0500
categories: dotnet csharp
tags: windows authentication MVC
comments: true
published: true
---

This is a demo of Windows Authentication implemented in .NET MVC and is similar to what I did for an internal site in our organization.  <!--more--> 

I needed to re-implement a legacy application. This application had *hard-coded* individual users in the ```Authorize``` attribute of the controller. Unfortunately, because it was deployed as a binary DLL, and the original source code was nowhere to be found, adding new users is impossible. 

In a nutshell, authenticated users need to log in order to manage school programs and enrollees to this program. This application has one component --- a public-facing page --- where the public can enroll to a program. For the purpose of demonstration, I'm referring to the public page **Enroll**, and the secure page **Manage**. 

### Quick Overview

To quickly summarize what I did, these are the things I needed to do to get the authentication to work.

* Added in web.config
    * **LDAP** connection string
    * **membership** provider
    * **role** provider
* Added ```Authorize``` attribute in ```ManageController```class. Placing the ```Authorize``` attribute above the class will restrict access to the all ManageController's actions (e.g., Index, Create, Read, Update, Delete, and all custom methods). You may also restrict just specific actions by putting the ```Authorize``` attribute above those actions.
* Lastly, in IIS, I enabled both **Windows Authentication** and **Anonymous Authentication**.
* Minor detail, but still important to mention --- if you're doing this on Visual Studio, you need to run it **as administrator**.

___
## Web.config

The web.config is where most of the Windows authentication implementation happens (in fact, I was pleasantly surprised that I only needed to do one thing inside my actual code). I'm not going to show you the full content of my web.config, but just the most important things, and these are:

```
<configuration>

<connectionStrings>
    <add name="ADService" connectionString="LDAP://AVASAY.ldapServer" />
</connectionStrings>

<authentication mode="Windows" />

<system.web>
    <membership defaultProvider="AspNetActiveDirectoryMembershipProvider">
        <providers>
        <add name="AspNetActiveDirectoryMembershipProvider" 
            type="System.Web.Security.ActiveDirectoryMembershipProvider, System.Web, Version=4.0.0.0 Culture=neutral, PublicKeyToken=b03f5f7f11d50a3a" 
            attributeMapUsername="sAMAccountName"
            connectionStringName="ADService" 
            passwordAttemptWindow="10" applicationName="/" 
            connectionUsername="xxxxxxxx" 
            connectionPassword="xxxxxxxxxx" />
        </providers>
    </membership>
</system.web>
<roleManager defaultProvider="WindowsProvider" enabled="true" cacheRolesInCookie="false">
    <providers>
        <add name="WindowsProvider" type="System.Web.Security.WindowsTokenRoleProvider" />
    </providers>
</roleManager>

<configuration>
```
As you can see, the most important elements in web.config are: 
* ```<connectionStrings>```, 
* ```<authentication mode="Windows" />```
* ```<membership defaultProvider>```, and 
* ```<roleManage defaultProvider>```.

### Brief Explanation
The connection string tells the system where your active directory is:
```
<connectionStrings>
    <add name="ADService" connectionString="LDAP://AVASAY.NET/DC=tccdweb,DC=net" />
</connectionStrings>
```
Obviously, this is not our actual LDAP URL. But in these example, AVASAY is the domain or domain controller, and the rest of the string is pretty much how you would organize the URL.

**Important Note**: To test successfully, the application server/machine must be a member of that domain. For example, in my local machine where I'm testing the application, I'm logged in as AVASAY\alejandrio.vasay.  

The next line is self-explanatory.
```
<authentication mode="Windows" />
```
And that's it! **I DID NOT need** an ```<authorization>``` tag like this:
```
<authorization>
    <allow roles="AVASAY\ProgramManagers" />
    <deny users="?" />
</authorization>
```
In my MVC application, I authorized roles inside my controller, which I will explain later. In fact, having authorization tag in web. config and not in my controller did not work for me. 

The next node, ```membership```, 
```
<membership defaultProvider="AspNetActiveDirectoryMembershipProvider">
```
and everything within ```<providers>``` is what connects our app to the domain controller. The most important key-values are:
* ```attributeMapUsername="sAMAccountName"``` --- this says that we are using usernames without the @domain part(normally, an email address). If you don't want to use *sAMAccountName*, you can use *userPrinciplaName* which uses the @domain part.
* ```connectionStringName="ADService"``` --- the ADService was the LDAP connection string from earlier.
* ```connectionUsername="xxxxxxxx" connectionPassword="xxxxxxxxxx" />``` --- the username/password is needed to gain entry into active directory.

