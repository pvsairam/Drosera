// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// Event log structure from Drosera
struct EventLog {
    bytes32[] topics;
    bytes data;
    address emitter;
}

// Event filter for matching logs
struct EventFilter {
    address contractAddress;
    string signature;
}

// Abstract Trap contract from Drosera
// All monitoring contracts inherit from this
abstract contract Trap {
    EventLog[] private eventLogs;

    // Collect data from the blockchain each block
    function collect() external view virtual returns (bytes memory);

    // Determine if on-chain response should trigger
    function shouldRespond(
        bytes[] calldata data
    ) external pure virtual returns (bool, bytes memory);

    // Determine if alert should be sent
    function shouldAlert(
        bytes[] calldata data
    ) external view virtual returns (bool, bytes memory);

    // Define which events to filter for
    function eventLogFilters() public view virtual returns (EventFilter[] memory) {
        EventFilter[] memory filters = new EventFilter[](0);
        return filters;
    }

    // Version of the trap protocol
    function version() public pure returns (string memory) {
        return "2.0";
    }

    // Store event logs from the block (called by operators)
    function setEventLogs(EventLog[] calldata logs) public {
       EventLog[] storage storageArray = eventLogs;

        for (uint256 i = 0; i < logs.length; i++) {
            storageArray.push(EventLog({
                emitter: logs[i].emitter,
                topics: logs[i].topics,
                data: logs[i].data
            }));
        }
    }

    // Retrieve stored event logs
    function getEventLogs() public view returns (EventLog[] memory) {
        EventLog[] storage storageArray = eventLogs;
        EventLog[] memory logs = new EventLog[](storageArray.length);

        for (uint256 i = 0; i < storageArray.length; i++) {
            logs[i] = EventLog({
                emitter: storageArray[i].emitter,
                topics: storageArray[i].topics,
                data: storageArray[i].data
            });
        }
        return logs;
    }
}
