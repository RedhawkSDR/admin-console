#
# This file is protected by Copyright. Please refer to the COPYRIGHT file
# distributed with this source distribution.
#
# This file is part of REDHAWK core.
#
# REDHAWK core is free software: you can redistribute it and/or modify it under
# the terms of the GNU Lesser General Public License as published by the Free
# Software Foundation, either version 3 of the License, or (at your option) any
# later version.
#
# REDHAWK core is distributed in the hope that it will be useful, but WITHOUT
# ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
# FOR A PARTICULAR PURPOSE.  See the GNU Lesser General Public License for more
# details.
#
# You should have received a copy of the GNU Lesser General Public License
# along with this program.  If not, see http://www.gnu.org/licenses/.
#
%define _prefix /var/redhawk/web
%define _client %{_prefix}/admin-console
%define _nginx /etc/nginx/conf.d/redhawk-sites

%define bower node_modules/bower/bin/bower
%define grunt node_modules/grunt-cli/bin/grunt

Prefix:         %{_prefix}
Name:		redhawk-admin-console
Version:	2.0.0
Release:	1%{?dist}
Summary:	The REDHAWK Web Baseline used for web applications

License:	GPL
BuildRoot:	%(mktemp -ud %{_tmppath}/%{name}-%{version}-%{release}-XXXXXX)
Source0:        %{name}-%{version}.tar.gz

Requires:       redhawk >= 1.10.2
Requires:       redhawk-web
Requires:       redhawk-rest-python >= 2.0.0
BuildRequires:  npm
BuildRequires:  git


%description
%{summary}
 * Commit: __REVISION__
 * Source Date/Time: __DATETIME__

%prep
%setup -q

%build

%install
%{?npm_registry: npm set registry %{npm_registry} }
npm install
%{grunt} dist

mkdir -p $RPM_BUILD_ROOT%{_prefix}
cp -R dist $RPM_BUILD_ROOT%{_client}

mkdir -p $RPM_BUILD_ROOT/etc/nginx/conf.d/redhawk-sites
cp deploy/admin-console-nginx.conf $RPM_BUILD_ROOT%{_nginx}/redhawk-admin-console.enabled

%clean
rm -rf %{buildroot}

%files
%defattr(-,redhawk,redhawk,-)
%dir %{_client}
%{_client}/index.html
%{_client}/css
%{_client}/images
%{_client}/js
%{_client}/lib
%{_client}/font
%{_client}/fonts

%defattr(-,root,root,-)
%{_nginx}/redhawk-admin-console.enabled



%changelog
* Mon Feb 9 2015 Youssef Bagoulla <youssef.bagoulla@axiosengineering.com> - 2.0.0-1
- Allowing flag for custom npm server, removing bower install since bower components are tracked.

