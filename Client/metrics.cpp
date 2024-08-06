#include <iostream>
#include <Windows.h>
#include <pdh.h>
#include <pdhmsg.h>
#include <iomanip>
#include <sstream>

#pragma comment(lib, "pdh.lib")

using namespace std;

string jsonEscape(const string &str)
{
    stringstream ss;
    for (char c : str)
    {
        switch (c)
        {
        case '\"':
            ss << "\\\"";
            break;
        case '\\':
            ss << "\\\\";
            break;
        case '\b':
            ss << "\\b";
            break;
        case '\f':
            ss << "\\f";
            break;
        case '\n':
            ss << "\\n";
            break;
        case '\r':
            ss << "\\r";
            break;
        case '\t':
            ss << "\\t";
            break;
        default:
            if ('\x00' <= c && c <= '\x1f')
            {
                ss << "\\u" << hex << setw(4) << setfill('0') << int(c);
            }
            else
            {
                ss << c;
            }
        }
    }
    return ss.str();
}

int main()
{
    // CPU Usage
    PDH_HQUERY cpuQuery;
    PDH_HCOUNTER cpuTotal;
    PdhOpenQuery(NULL, 0, &cpuQuery);
    PdhAddCounterW(cpuQuery, L"\\Processor(_Total)\\% Processor Time", 0, &cpuTotal);
    PdhCollectQueryData(cpuQuery);
    Sleep(1000);
    PdhCollectQueryData(cpuQuery);
    PDH_FMT_COUNTERVALUE cpuCounterVal;
    PdhGetFormattedCounterValue(cpuTotal, PDH_FMT_DOUBLE, NULL, &cpuCounterVal);
    double cpuUsage = cpuCounterVal.doubleValue;

    // GPU Usage (assuming NVIDIA GPU). Planning on adding AMD support.
    PDH_HQUERY gpuQuery;
    PDH_HCOUNTER gpuTotal;
    PdhOpenQuery(NULL, 0, &gpuQuery);
    PdhAddCounterW(gpuQuery, L"\\GPU Engine(*)\\Utilization Percentage", 0, &gpuTotal);
    PdhCollectQueryData(gpuQuery);
    Sleep(1000);
    PdhCollectQueryData(gpuQuery);
    PDH_FMT_COUNTERVALUE gpuCounterVal;
    PdhGetFormattedCounterValue(gpuTotal, PDH_FMT_DOUBLE, NULL, &gpuCounterVal);
    double gpuUsage = gpuCounterVal.doubleValue;

    // RAM Usage
    MEMORYSTATUSEX memInfo;
    memInfo.dwLength = sizeof(MEMORYSTATUSEX);
    GlobalMemoryStatusEx(&memInfo);
    DWORDLONG totalPhysMem = memInfo.ullTotalPhys;
    DWORDLONG physMemUsed = memInfo.ullTotalPhys - memInfo.ullAvailPhys;
    double ramUsage = (physMemUsed * 100.0 / totalPhysMem);

    // System Uptime
    ULONGLONG uptime = GetTickCount64() / 1000;
    double uptimeHours = uptime / 3600.0;

    // Placeholders for the moment
    double powerUsage = 100.0; 
    double cpuTemp = 0.0;
    double gpuTemp = 0.0;

    cout << "{";
    cout << "\"cpu\": {";
    cout << "\"usage\": \"" << fixed << setprecision(2) << cpuUsage << "%\",";
    cout << "\"temp\": \"" << fixed << setprecision(2) << cpuTemp << "° C\"";
    cout << "},";
    cout << "\"gpu\": {";
    cout << "\"usage\": \"" << fixed << setprecision(2) << gpuUsage << "%\",";
    cout << "\"temp\": \"" << fixed << setprecision(2) << gpuTemp << "° C\"";
    cout << "},";
    cout << "\"ramUsage\": \"" << fixed << setprecision(2) << ramUsage << "%\",";
    cout << "\"powerUsage\": \"" << fixed << setprecision(2) << powerUsage << " w\",";
    cout << "\"uptime\": \"" << fixed << setprecision(2) << uptimeHours << " h\"";
    cout << "}" << endl;

    PdhCloseQuery(cpuQuery);
    PdhCloseQuery(gpuQuery);

    return 0;
}