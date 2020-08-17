//
//  MenuView.swift
//  ProcessCore
//
//  Created by Tim Okolowski on 14.08.20.
//  Copyright © 2020 Huf Secure Mobile GmbH. All rights reserved.
//

import SwiftUI

struct MenuView : View {
    
    var body: some View {
        NavigationView {
            NavigationLink(destination: LazyView(SampleProcessView())) {
                Text("Start Counter Demo")
            }
            .navigationBarTitle("Process Engine")
        }
    }
}
