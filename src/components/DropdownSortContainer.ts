import { Component, ReactElement, createElement } from "react";
import { findDOMNode } from "react-dom";
import * as dijitRegistry from "dijit/registry";
import * as classNames from "classnames";
import * as dojoConnect from "dojo/_base/connect";

import { Dropdown, DropdownProps } from "./Dropdown";
import { ValidateConfigs } from "./ValidateConfigs";
import { DropdownSortState, ListView, WrapperProps, createOptionProps, parseStyle } from "../utils/ContainerUtils";
import { PreLoader } from "./PreLoader";

import "../ui/DropdownSort.scss";

export default class DropdownSort extends Component<WrapperProps, DropdownSortState> {
    private navigationHandler: object;

    constructor(props: WrapperProps) {
        super(props);

        this.state = {
            alertMessage: "",
            findingListviewWidget: true,
            isLoading: true
        };
        this.updateSort = this.updateSort.bind(this);
        this.validateListView = this.validateListView.bind(this);
        this.navigationHandler = dojoConnect.connect(props.mxform, "onNavigation", this, this.validateListView);
    }

    render() {
        return createElement("div",
            {
                className: classNames("widget-drop-down-sort", this.props.class),
                style: parseStyle(this.props.style)
            },
            createElement(ValidateConfigs, {
                ...this.props as WrapperProps,
                queryNode: this.state.targetNode,
                targetListview: this.state.targetListView,
                validate: !this.state.findingListviewWidget
            }),
            this.renderDropdown(),
            this.state.isLoading && this.state.validationPassed ? createElement(PreLoader) : null
        );
    }

    componentWillUnmount() {
        dojoConnect.disconnect(this.navigationHandler);
    }

    private renderDropdown(): ReactElement<DropdownProps> | null {
        if (this.state.validationPassed) {
            return createElement(Dropdown, {
                onDropdownChangeAction: this.updateSort,
                options: createOptionProps(this.props.sortAttributes),
                style: parseStyle(this.props.style)
            });
        }

        return null;
    }

    private validateListView() {
        if (!this.state.validationPassed) {
            const queryNode = findDOMNode(this).parentNode as HTMLElement;
            const targetNode = ValidateConfigs.findTargetNode(queryNode);
            let targetListView: ListView | null = null;

            if (targetNode) {
                this.setState({ targetNode });
                this.showPreLoader();
                targetListView = dijitRegistry.byNode(targetNode);
                if (targetListView) {
                    this.setState({ targetListView });
                }
            }

            const validateMessage = ValidateConfigs.validate({
                ...this.props as WrapperProps,
                queryNode: this.state.targetNode,
                targetListview: this.state.targetListView,
                validate: !this.state.findingListviewWidget
            });

            this.setState({ findingListviewWidget: false, validationPassed: !validateMessage });
        }
    }

    private updateSort(attribute: string, order: string) {
        const { targetNode, targetListView, validationPassed } = this.state;

        if (targetListView && targetNode && validationPassed) {
            this.showPreLoader();
            targetListView._datasource._sorting = [ [ attribute, order ] ];
            targetListView.update(null, () => {
                this.hidePreLoader();
            });
        }
    }

    private showPreLoader() {
        if (this.state.targetNode) {
            this.state.targetNode.style.display = "none";
        }

        this.setState({ isLoading: true });
    }

    private hidePreLoader() {
        if (this.state.targetNode) {
            this.state.targetNode.style.display = "inline";
        }

        this.setState({ isLoading: false });
    }
}
