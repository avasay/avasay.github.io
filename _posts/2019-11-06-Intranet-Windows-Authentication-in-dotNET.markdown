---
layout: post
title:  "Windows Authentication with .NET MVC"
date:   2019-11-06 08:10:00 -0500
categories: dotnet csharp
tags: windows authentication MVC
comments: true
published: true
---

This is a demo of Windows Authentication implemented in .NET MVC and is similar to what I did for an internal site in our organization.  <!--more--> 

I needed to re-implement a legacy application that *hard-coded* authorized users in the ```Authorize``` attribute of the controller. Secondly, there was no source code or documentation to go by, except the binary DLL. 

Our internal site has one caveat --- it has a public-facing page, where the public can download information. There is a secure portal that only internal (authorized) users can access. Let's call the public page **Home**, and the secure page **Manage**. Because this is an MVC application, I have a Home controller and a Manage controller.

To get straight to the point, the following things are the only things I needed to do to get the authentication to work.
* Added the following to web.config:

```
<connectionStrings>
    <add name="ADService" connectionString="LDAP://ldapServer" />
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
```

* Added the ```Authorize``` attribute to my ManageController.

```
[Authorize(Users = "ALEJANDRIO.VASAY")]
public class ManageController : Controller
{
    // GET: Manage
    public ActionResult Index()
    {
        return View();
    }
}
```

* In IIS, I enabled both Windows Authentication and Anonymous Authentication.




