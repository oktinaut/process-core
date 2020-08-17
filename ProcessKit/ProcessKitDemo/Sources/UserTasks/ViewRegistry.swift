//
//  ViewRegistry.swift
//  ProcessCore
//
//  Created by Tim Okolowski on 14.08.20.
//  Copyright © 2020 Huf Secure Mobile GmbH. All rights reserved.
//

import SwiftUI
import ProcessKit

let viewRegistry: ViewRegistry = [
    "set-initial-counter": { token in
        AnyView(SetInitialCounterView(token: token))
    },
    "validate-counter": { _ in
        AnyView(InitializeCounterView())
    },
    "display-counter": { token in
        AnyView(DisplayCounterView(token: token))
    },
    "display-results": { token in
        AnyView(DisplayResultsView(token: token))
    },
    "display-error": { token in
        AnyView(DisplayErrorView(token: token))
    },
]
